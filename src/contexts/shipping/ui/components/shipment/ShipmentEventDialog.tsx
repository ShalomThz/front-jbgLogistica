import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { shippingPolicies } from "@contexts/shared/domain/policies/shipping.policy";
import {
  TONE_EVENT,
  type StatusTone,
} from "@contexts/shared/domain/schemas/StatusTone";
import { parseApiError } from "@contexts/shared/infrastructure/http/errors";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@contexts/shared/shadcn";
import { cn } from "@contexts/shared/shadcn/lib/utils";
import { CameraPhotoInput } from "@contexts/shared/ui/components/CameraPhotoInput";
import { MAX_EVIDENCE_PHOTOS } from "@contexts/shipping/application/shipment/RecordShipmentEventRequest";
import {
  BLOCKED_REASON,
  type AvailableShipmentEvent,
  type EvidenceRequirement,
} from "@contexts/shipping/application/shipment/AvailableShipmentEventsResponse";
import {
  STAGE_LABELS,
  stageIndex,
  toneForStage,
  type ShipmentStage,
} from "@contexts/shipping/domain/schemas/shipment/ShipmentStages";
import {
  SHIPMENT_STATUS_LABELS,
  SHIPMENT_STATUS_TONE,
} from "@contexts/shipping/domain/schemas/shipment/ShipmentStatuses";
import {
  SHIPPING_MODE_LABELS,
  shippingModes,
  type ShippingMode,
} from "@contexts/shipping/domain/schemas/shipment/ShippingModes";
import { timelineStages } from "@contexts/shipping/domain/services/timelineStages";
import { useHQSettings } from "@contexts/settings/infrastructure/hooks/useSkydropxSettings";
import {
  useAvailableShipmentEvents,
  useShipmentById,
  useStageLocks,
} from "@contexts/shipping/infrastructure/hooks/shipments/useShipment";
import { useShipmentActions } from "@contexts/shipping/infrastructure/hooks/shipments/useShipments";
import { Check, Info, ListPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ShipmentStageTimeline } from "./ShipmentStageTimeline";

interface Props {
  shipmentId: string;
  /** Para que el título diga de qué paquete se trata. */
  reference?: string | null;
  /** La línea de la orden, cuando se conoce (el detalle). Sin esto —el detalle
   * de la ruta, que solo tiene el `shipmentId`— se arma con el envío. */
  timeline?: {
    stages: readonly ShipmentStage[];
    current: ShipmentStage | null;
    tone: StatusTone;
  };
  /** Solo el icono, para una fila apretada como la lista de paradas. */
  compact?: boolean;
}

/** Etapas donde importa en qué bodega pasó, aunque el evento no lo exija. */
const WAREHOUSE_STAGES: ReadonlySet<ShipmentStage> = new Set([
  "ORIGIN_WAREHOUSE",
  "DESTINATION_WAREHOUSE",
  "DISTRIBUTION",
]);

const EVIDENCE_HINT: Record<EvidenceRequirement, string> = {
  required: "obligatoria",
  optional: "opcional",
  none: "",
};

/** `""` no es "sin valor" para el back, que lo rechaza: se manda `undefined`. */
const orUndefined = (value: string) => value.trim() || undefined;

/**
 * Registra un evento de la línea de tiempo: lo que marca la bodega (recibido
 * en origen, cargado, en aduana, recibido en destino) y lo que el conductor no
 * alcanzó a registrar.
 *
 * Se elige primero la **etapa** sobre la misma línea que muestra el detalle,
 * así se ve dónde va a quedar el paquete, y después el **evento** de esa etapa.
 * Solo se ofrece lo que el back dice que se puede registrar desde el estatus
 * actual (`/events/available`): el front no guarda una copia del catálogo que
 * pueda desincronizarse.
 *
 * Qué pide cada evento —foto, firma, bodega, quién recibe— también viene del
 * back. Si además cambia el estatus operativo, las observaciones son
 * obligatorias: reemplazan lo que debió registrar el conductor o la paquetería.
 *
 * Se muestra solo con `CAN_RECORD_SHIPMENT_EVENTS`.
 */
export const ShipmentEventDialog = ({
  shipmentId,
  reference,
  timeline,
  compact = false,
}: Props) => {
  const { user } = useAuth();
  const { recordShipmentEvent, isRecordingEvent } = useShipmentActions();

  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<ShipmentStage | null>(null);
  const [code, setCode] = useState("");
  const [notes, setNotes] = useState("");
  // La posición en la lista de Configuración, como la cotización de HQ: lo que
  // viaja es la copia de la dirección, no una referencia.
  const [warehouseIndex, setWarehouseIndex] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [transportMode, setTransportMode] = useState<ShippingMode | "">("");
  const [consolidationRef, setConsolidationRef] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  // Una sola firma, pero el componente de foto trabaja con listas.
  const [signature, setSignature] = useState<File[]>([]);

  const { data: availability, isLoading } = useAvailableShipmentEvents(
    shipmentId,
    open,
  );
  const available = availability?.events ?? [];
  const { data: shipment } = useShipmentById(shipmentId, open && !timeline);
  const { skydropxAddresses: warehouses } = useHQSettings({ enabled: open });

  const availableStages = new Set(available.map((e) => e.stage));
  const current = timeline?.current ?? shipment?.stage ?? null;
  const tone =
    timeline?.tone ??
    (shipment ? SHIPMENT_STATUS_TONE[shipment.status] : "draft");
  const stages =
    timeline?.stages ??
    timelineStages(
      {
        hasAgentStage: current === "AGENT" || availableStages.has("AGENT"),
        viaCarrier: shipment?.provider?.type === "THIRD_PARTY",
      },
      current,
    );

  // Lo que falta en cada etapa apagada, para decirlo sobre el paso en vez de
  // mostrarlo solo gris, y la siguiente si la actual ya está cumplida.
  const { requirements, nextStage } = useStageLocks(
    shipmentId,
    stages,
    current,
    open,
  );

  if (!user || !shippingPolicies.recordEvents(user)) return null;

  // Sin elección, arranca en la siguiente si la actual ya está cumplida, y si
  // no en la primera etapa con eventos desde la actual: lo normal es registrar
  // lo que sigue, no corregir lo que pasó.
  const offered = stages.filter((s) => availableStages.has(s));
  const defaultStage =
    nextStage ??
    offered.find((s) => !current || stageIndex(s) >= stageIndex(current)) ??
    offered[0] ??
    null;
  const activeStage = stage ?? defaultStage;

  const stageEvents = available.filter((e) => e.stage === activeStage);
  const event = stageEvents.find((e) => e.code === code) ?? null;
  const warehouse = warehouseIndex ? warehouses[Number(warehouseIndex)] : null;

  const resetFields = () => {
    setCode("");
    setNotes("");
    setWarehouseIndex("");
    setRecipientName("");
    setTransportMode("");
    setConsolidationRef("");
    setPhotos([]);
    setSignature([]);
  };

  const pickStage = (next: ShipmentStage) => {
    setStage(next);
    // Lo cargado era para un evento de otra etapa.
    resetFields();
  };

  const closeAndReset = () => {
    setOpen(false);
    setStage(null);
    resetFields();
  };

  const missing = event
    ? [
        event.photo === "required" &&
          photos.length === 0 &&
          "al menos una foto",
        event.signature === "required" && signature.length === 0 && "la firma",
        event.requiresLocation && !warehouse && "la bodega",
        event.requiresRecipient && !recipientName.trim() && "quién recibe",
        event.movesTo && !notes.trim() && "las observaciones",
      ].filter((m): m is string => !!m)
    : [];
  const canSubmit = !!event && missing.length === 0 && !isRecordingEvent;

  const handleSubmit = async () => {
    if (!event || !canSubmit) return;
    try {
      await recordShipmentEvent({
        shipmentId,
        eventCode: event.code,
        notes: orUndefined(notes),
        location: warehouse
          ? {
              name: warehouse.name,
              city: warehouse.address.city,
              state: warehouse.address.province,
              country: warehouse.address.country,
            }
          : undefined,
        recipientName: orUndefined(recipientName),
        transportMode: transportMode || undefined,
        consolidationRef: orUndefined(consolidationRef),
        photos: photos.length > 0 ? photos : undefined,
        signature: signature[0],
      });
      toast.success(`Registrado: ${event.label}`);
      closeAndReset();
    } catch (error) {
      toast.error(parseApiError(error));
    }
  };

  return (
    <>
      {compact ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-6"
          title="Registrar evento"
          onClick={() => setOpen(true)}
        >
          <ListPlus className="size-3.5" />
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => setOpen(true)}
        >
          <ListPlus className="size-3.5" />
          Registrar evento
        </Button>
      )}

      <Dialog open={open} onOpenChange={(v) => !v && closeAndReset()}>
        {/* `flex` y no el `grid` del componente base: en un grid los hijos no
            se encogen por debajo de su contenido y la línea estiraba el modal.
            Solo el cuerpo scrollea; el título y los botones quedan a la vista. */}
        <DialogContent className="flex max-h-[90dvh] flex-col gap-4 sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registrar evento</DialogTitle>
            <DialogDescription>
              {reference ? `Envío de la orden ${reference}. ` : null}
              Queda en el historial con fecha, responsable y evidencia; no se
              borra lo anterior.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 min-w-0 flex-1 space-y-4 overflow-y-auto">
            {isLoading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Consultando el envío...
              </p>
            ) : available.length === 0 ? (
              <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                Desde el estado actual no hay eventos para registrar.
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Etapa</Label>
                  <ShipmentStageTimeline
                    stages={stages}
                    current={current}
                    tone={tone}
                    focused={activeStage}
                    onFocus={pickStage}
                    enabled={availableStages}
                    requirements={requirements}
                    currentCompleted={!!nextStage}
                  />
                </div>

                {activeStage && (
                  <div className="space-y-2">
                    <Label>Evento de {STAGE_LABELS[activeStage]}</Label>
                    <div className="grid gap-1.5 sm:grid-cols-2">
                      {stageEvents.map((option) => (
                        <EventOption
                          key={option.code}
                          option={option}
                          tone={toneForStage(option.stage, tone)}
                          selected={option.code === code}
                          onSelect={() => {
                            // Volver a tocar el ya elegido no debe borrar lo
                            // cargado.
                            if (option.code === code) return;
                            resetFields();
                            setCode(option.code);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {event && (
                  <div className="space-y-3 rounded-md border bg-muted/30 p-3">
                    {event.movesTo && (
                      <p className="text-xs text-muted-foreground">
                        Además cambia el estatus a{" "}
                        <span className="font-medium text-foreground">
                          {SHIPMENT_STATUS_LABELS[event.movesTo]}
                        </span>
                        .
                      </p>
                    )}

                    {(event.requiresLocation ||
                      WAREHOUSE_STAGES.has(event.stage)) && (
                      <div className="space-y-1.5">
                        <Label className="text-xs">
                          Bodega {event.requiresLocation ? "" : "(opcional)"}
                        </Label>
                        {warehouses.length === 0 ? (
                          <p className="text-xs text-muted-foreground">
                            No hay direcciones de bodega. Agrégalas en
                            Configuración.
                          </p>
                        ) : (
                          <Select
                            value={warehouseIndex}
                            onValueChange={setWarehouseIndex}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Elige la bodega" />
                            </SelectTrigger>
                            <SelectContent>
                              {warehouses.map((w, index) => (
                                <SelectItem key={index} value={String(index)}>
                                  {w.name} — {w.address.city},{" "}
                                  {w.address.province}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    )}

                    {event.stage === "DISPATCHED" && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs">
                            Tipo de salida (opcional)
                          </Label>
                          <Select
                            value={transportMode}
                            onValueChange={(v) =>
                              setTransportMode(v as ShippingMode)
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Terrestre, marítima o aérea" />
                            </SelectTrigger>
                            <SelectContent>
                              {shippingModes.map((mode) => (
                                <SelectItem key={mode} value={mode}>
                                  {SHIPPING_MODE_LABELS[mode]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="event-consolidation"
                            className="text-xs"
                          >
                            Consolidado (opcional)
                          </Label>
                          <Input
                            id="event-consolidation"
                            value={consolidationRef}
                            onChange={(e) =>
                              setConsolidationRef(e.target.value)
                            }
                            placeholder="Ej. MX-0927"
                          />
                        </div>
                      </div>
                    )}

                    {event.requiresRecipient && (
                      <div className="space-y-1.5">
                        <Label htmlFor="event-recipient" className="text-xs">
                          Nombre de quien recibe
                        </Label>
                        <Input
                          id="event-recipient"
                          value={recipientName}
                          onChange={(e) => setRecipientName(e.target.value)}
                        />
                      </div>
                    )}

                    {event.photo !== "none" && (
                      <CameraPhotoInput
                        id="event-photo"
                        label={`Fotos (${EVIDENCE_HINT[event.photo]})`}
                        cameraTitle={event.label}
                        value={photos}
                        onChange={setPhotos}
                        max={MAX_EVIDENCE_PHOTOS}
                      />
                    )}

                    {event.signature !== "none" && (
                      <CameraPhotoInput
                        id="event-signature"
                        label={`Firma (${EVIDENCE_HINT[event.signature]})`}
                        cameraTitle="Foto de la firma"
                        value={signature}
                        onChange={setSignature}
                      />
                    )}

                    <div className="space-y-1.5">
                      <Label htmlFor="event-notes" className="text-xs">
                        Observaciones {event.movesTo ? "" : "(opcional)"}
                      </Label>
                      <Textarea
                        id="event-notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={
                          event.movesTo
                            ? "Ej. El chofer entregó el viernes y no lo registró"
                            : "Ej. Caja sin daño visible"
                        }
                        rows={2}
                      />
                    </div>

                    {missing.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Falta {missing.join(", ")}.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeAndReset}
              disabled={isRecordingEvent}
            >
              Volver
            </Button>
            {available.length > 0 && (
              <Button onClick={handleSubmit} disabled={!canSubmit}>
                {isRecordingEvent ? "Guardando..." : "Registrar"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

/**
 * Con el color de la orden y la misma jerarquía que la lista de eventos: el
 * elegido resaltado —así se ve como va a quedar en el historial—, el resto
 * atenuado. Los ya registrados llevan ✓.
 *
 * Los bloqueados por la venta se muestran igual, deshabilitados y con el
 * motivo: así se ve qué viene después y por qué todavía no.
 */
const EventOption = ({
  option,
  tone,
  selected,
  onSelect,
}: {
  option: AvailableShipmentEvent;
  tone: StatusTone;
  selected: boolean;
  onSelect: () => void;
}) => {
  const details = [
    option.recorded && "registrado",
    option.movesTo && `→ ${SHIPMENT_STATUS_LABELS[option.movesTo]}`,
    option.photo === "required" && "foto obligatoria",
  ].filter(Boolean);

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!!option.blocked}
      aria-pressed={selected}
      className={cn(
        "rounded-md border border-l-4 px-3 py-2 text-left text-sm transition-colors",
        option.blocked
          ? "cursor-not-allowed border-dashed border-l-muted-foreground/25 bg-muted/40 text-muted-foreground"
          : selected
            ? cn("font-medium", TONE_EVENT[tone].latest)
            : cn("hover:bg-muted", TONE_EVENT[tone].earlier),
      )}
    >
      <span className="flex items-center gap-1.5">
        {option.recorded && (
          <Check className="size-3.5 shrink-0 text-muted-foreground" />
        )}
        {option.label}
      </span>
      {option.blocked ? (
        <span className="mt-0.5 flex items-center gap-1 text-[11px] font-normal">
          <Info className="size-3 shrink-0" />
          {BLOCKED_REASON[option.blocked]}
        </span>
      ) : (
        details.length > 0 && (
          <span className="block text-[11px] font-normal text-muted-foreground">
            {details.join(" · ")}
          </span>
        )
      )}
    </button>
  );
};
