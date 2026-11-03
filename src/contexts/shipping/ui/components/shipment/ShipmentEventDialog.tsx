import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { shippingPolicies } from "@contexts/shared/domain/policies/shipping.policy";
import type { StatusTone } from "@contexts/shared/domain/schemas/StatusTone";
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
import { DateTimePicker } from "@contexts/shared/ui/components/DateTimePicker";
import {
  MAX_EVIDENCE_PHOTOS,
  occurredAtFromInput,
} from "@contexts/shipping/application/shipment/RecordShipmentEventRequest";
import { ADVANCE_BLOCK_MESSAGES } from "@contexts/shipping/application/shipment/AvailableShipmentEventsResponse";
import {
  STAGE_LABELS,
  type ShipmentStage,
} from "@contexts/shipping/domain/schemas/shipment/ShipmentStages";
import { SHIPMENT_STATUS_TONE } from "@contexts/shipping/domain/schemas/shipment/ShipmentStatuses";
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
} from "@contexts/shipping/infrastructure/hooks/shipments/useShipment";
import { useShipmentActions } from "@contexts/shipping/infrastructure/hooks/shipments/useShipments";
import {
  ArrowRight,
  ChevronRight,
  Info,
  ListPlus,
} from "lucide-react";
import { useState, type ReactNode } from "react";
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
  /** Lo lleva una paquetería: el botón dice que es para anotar, porque su
   * estatus no se mueve a mano. Las rutas son de la flota JBG y no lo pasan. */
  viaCarrier?: boolean;
}

/** Avanzar al paso que sigue, o solo dejar una línea en el historial. */
type Mode = "advance" | "note";

/** En el selector de avanzar: dejar el texto del paso, sin atajo. Radix no
 * admite `""` como valor de una opción. */
const STEP_DEFAULT = "__step__";

/** Etapas donde importa en qué bodega pasó, aunque el evento no lo exija. */
const WAREHOUSE_STAGES: ReadonlySet<ShipmentStage> = new Set([
  "ORIGIN_WAREHOUSE",
  "DESTINATION_WAREHOUSE",
  "DISTRIBUTION",
]);

/** `""` no es "sin valor" para el back, que lo rechaza: se manda `undefined`. */
const orUndefined = (value: string) => value.trim() || undefined;

/**
 * Mueve el envío por su recorrido y deja constancia en el historial.
 *
 * **Avanzar** es la acción principal: lleva al envío al paso que sigue y lo
 * dice antes, sobre la línea de tiempo. El texto que queda en el historial es
 * el del paso; el selector permite contarlo con otro evento de la misma etapa.
 * Una paquetería no se avanza a mano después de la venta: su estatus lo trae
 * Skydropx ("Actualizar envío"), y el diálogo abre en anotar.
 *
 * **Solo anotar** deja una línea en el historial sin mover nada: se elige la
 * etapa y el evento.
 *
 * Abajo, lo que el evento exige va siempre a la vista; lo opcional —
 * observaciones, fotos, bodega, despacho— va colapsado en "Agregar detalles".
 *
 * Qué pide cada evento viene del back, que también dice cuál es el paso que
 * sigue (`/events/available`). Se muestra solo con `CAN_RECORD_SHIPMENT_EVENTS`.
 */
export const ShipmentEventDialog = ({
  shipmentId,
  reference,
  timeline,
  compact = false,
  viaCarrier = false,
}: Props) => {
  const { user } = useAuth();
  const { recordShipmentEvent, isRecordingEvent } = useShipmentActions();

  const [open, setOpen] = useState(false);
  const [chosenMode, setChosenMode] = useState<Mode | null>(null);
  const [stage, setStage] = useState<ShipmentStage | null>(null);
  const [code, setCode] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
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
  // Vacío es "ahora"; con valor, lo que se carga después de los hechos.
  const [occurredAt, setOccurredAt] = useState("");

  const { data: availability, isLoading } = useAvailableShipmentEvents(
    shipmentId,
    open,
  );
  const catalog = availability?.events ?? [];
  const next = availability?.next ?? null;
  const blocked = availability?.blocked ?? null;
  const { data: shipment } = useShipmentById(shipmentId, open && !timeline);
  const { skydropxAddresses: warehouses } = useHQSettings({ enabled: open });

  const current = timeline?.current ?? shipment?.stage ?? null;
  const tone =
    timeline?.tone ??
    (shipment ? SHIPMENT_STATUS_TONE[shipment.status] : "draft");
  const stages =
    timeline?.stages ??
    timelineStages(
      {
        hasAgentStage: current === "AGENT",
        viaCarrier: shipment?.provider?.type === "THIRD_PARTY",
      },
      current,
    );

  if (!user || !shippingPolicies.recordEvents(user)) return null;

  // Avanzar es lo normal. Sin paso que seguir la pestaña sigue ahí, diciendo
  // por qué; anotar en el historial se puede siempre. Una paquetería abre en
  // anotar: su estatus no se mueve a mano.
  const mode: Mode =
    blocked === "CARRIER" ? "note" : (chosenMode ?? "advance");
  const activeStage =
    mode === "advance" ? (next?.stage ?? null) : (stage ?? current);

  // En el orden del catálogo, sin sugerencia: se elige lo que pasó.
  const stageEvents = catalog.filter((e) => e.stage === activeStage);
  const chosen = stageEvents.find((e) => e.code === code) ?? null;
  // Lo que pide la evidencia: el atajo elegido, o el evento del paso.
  const event =
    chosen ??
    (mode === "advance" && next?.eventCode
      ? (catalog.find((e) => e.code === next.eventCode) ?? null)
      : null);
  const warehouse = warehouseIndex ? warehouses[Number(warehouseIndex)] : null;

  // Lo que el evento exige va a la vista; lo demás, en los detalles.
  const needs = {
    warehouse: !!event?.requiresLocation,
    recipient: !!event?.requiresRecipient,
    photo: event?.photo === "required",
    signature: event?.signature === "required",
  };
  const required = Object.values(needs).some(Boolean);
  const fieldsStage = event?.stage ?? activeStage;
  const optional = {
    warehouse:
      !needs.warehouse && !!fieldsStage && WAREHOUSE_STAGES.has(fieldsStage),
    dispatch: fieldsStage === "DISPATCHED",
    photo: !needs.photo,
    signature: !needs.signature && event?.signature === "optional",
  };
  const detailsCount = [
    !!notes.trim(),
    optional.photo && photos.length > 0,
    optional.signature && signature.length > 0,
    optional.warehouse && !!warehouse,
    optional.dispatch && !!transportMode,
    optional.dispatch && !!consolidationRef.trim(),
    !!occurredAt,
  ].filter(Boolean).length;

  const resetFields = () => {
    setCode("");
    setDetailsOpen(false);
    setNotes("");
    setWarehouseIndex("");
    setRecipientName("");
    setTransportMode("");
    setConsolidationRef("");
    setPhotos([]);
    setSignature([]);
    setOccurredAt("");
  };

  const pickMode = (value: Mode) => {
    setChosenMode(value);
    setStage(null);
    resetFields();
  };

  const pickStage = (value: ShipmentStage) => {
    setStage(value);
    // Lo cargado era para un evento de otra etapa.
    resetFields();
  };

  const openDialog = () => setOpen(true);
  // Una paquetería solo se anota: el estatus lo trae Skydropx. Se sabe antes de
  // abrir por la prop, y al abrir lo confirma el back.
  const carrierLed = blocked === "CARRIER";
  const triggerLabel = viaCarrier ? "Anotar en historial" : "Avanzar / registrar";

  const closeAndReset = () => {
    setOpen(false);
    setChosenMode(null);
    setStage(null);
    resetFields();
  };

  const missing = [
    needs.photo && photos.length === 0 && "al menos una foto",
    needs.signature && signature.length === 0 && "la firma",
    needs.warehouse && !warehouse && "la bodega",
    needs.recipient && !recipientName.trim() && "quién recibe",
    mode === "note" && !chosen && "el evento",
  ].filter((m): m is string => !!m);
  // Avanzar sin paso que seguir no hace nada: el motivo ya está a la vista.
  const advanceBlocked = mode === "advance" && !next;
  const canSubmit =
    missing.length === 0 && !advanceBlocked && !isRecordingEvent;

  const description =
    mode === "advance" ? (chosen?.label ?? next?.label) : chosen?.label;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      await recordShipmentEvent({
        shipmentId,
        advance: mode === "advance" || undefined,
        eventCode: chosen?.code,
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
        occurredAt: occurredAtFromInput(occurredAt),
      });
      toast.success(
        mode === "advance" && activeStage
          ? `Avanzó a ${STAGE_LABELS[activeStage]}: ${description ?? ""}`
          : `Registrado: ${description ?? ""}`,
      );
      closeAndReset();
    } catch (error) {
      toast.error(parseApiError(error));
    }
  };

  const warehouseField = (isRequired: boolean) => (
    <div className="space-y-1.5">
      <Label className="text-xs">
        Bodega {isRequired ? <RequiredMark /> : "(opcional)"}
      </Label>
      {warehouses.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No hay direcciones de bodega. Agrégalas en Configuración.
        </p>
      ) : (
        <Select value={warehouseIndex} onValueChange={setWarehouseIndex}>
          <SelectTrigger
            className="w-full"
            aria-invalid={isRequired && !warehouse}
          >
            <SelectValue placeholder="Elige la bodega" />
          </SelectTrigger>
          <SelectContent>
            {warehouses.map((w, index) => (
              <SelectItem key={index} value={String(index)}>
                {w.name} — {w.address.city}, {w.address.province}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );

  const photosField = (label: string) => (
    <CameraPhotoInput
      id="event-photo"
      label={label}
      cameraTitle={description ?? "Evidencia"}
      value={photos}
      onChange={setPhotos}
      max={MAX_EVIDENCE_PHOTOS}
    />
  );

  const signatureField = (label: string) => (
    <CameraPhotoInput
      id="event-signature"
      label={label}
      cameraTitle="Foto de la firma"
      value={signature}
      onChange={setSignature}
    />
  );

  return (
    <>
      {compact ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-6"
          title={triggerLabel}
          onClick={openDialog}
        >
          <ListPlus className="size-3.5" />
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={openDialog}
        >
          <ListPlus className="size-3.5" />
          {triggerLabel}
        </Button>
      )}

      <Dialog open={open} onOpenChange={(v) => !v && closeAndReset()}>
        {/* `flex` y no el `grid` del componente base: en un grid los hijos no
            se encogen por debajo de su contenido y la línea estiraba el modal.
            Solo el cuerpo scrollea; el título y los botones quedan a la vista. */}
        <DialogContent className="flex max-h-[90dvh] flex-col gap-4 sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {mode === "advance" ? "Avanzar envío" : "Registrar en el historial"}
            </DialogTitle>
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
            ) : (
              <>
                {/* Una paquetería no se avanza a mano: no se ofrece la pestaña,
                    solo se dice por qué. */}
                {carrierLed ? (
                  <div className="flex items-start gap-2 rounded-md bg-muted p-3 text-sm">
                    <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <p>{ADVANCE_BLOCK_MESSAGES.CARRIER}</p>
                  </div>
                ) : (
                <div className="grid grid-cols-2 gap-1 rounded-md bg-muted p-1 text-sm">
                  {(["advance", "note"] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => pickMode(value)}
                      aria-pressed={mode === value}
                      className={cn(
                        "rounded px-3 py-1.5 transition-colors",
                        mode === value
                          ? "bg-background font-medium shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {value === "advance"
                        ? "Avanzar"
                        : "Solo anotar en el historial"}
                    </button>
                  ))}
                </div>
                )}

                {advanceBlocked ? (
                  <div className="space-y-3 rounded-md border p-3">
                    <ShipmentStageTimeline
                      stages={stages}
                      current={current}
                      tone={tone}
                    />
                    <div className="flex items-start gap-2 rounded-md bg-muted p-3 text-sm">
                      <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <div className="space-y-1">
                        <p className="font-medium">
                          {blocked
                            ? ADVANCE_BLOCK_MESSAGES[blocked]
                            : "No hay un paso que avanzar desde aquí."}
                        </p>
                        {/* En un cancelado tampoco se anota: el back lo rechaza. */}
                        {blocked !== "CANCELLED" && (
                          <p className="text-xs text-muted-foreground">
                            {blocked === "FINISHED"
                              ? 'Puedes dejar una nota en "Solo anotar en el historial".'
                              : 'Mientras tanto puedes dejar una nota en "Solo anotar en el historial".'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : mode === "advance" && next ? (
                  <>
                    {/* La misma línea del detalle, con el tramo hacia donde
                        avanza animado: se ve de dónde sale y a dónde llega. */}
                    <div className="space-y-2 rounded-md border p-3">
                      <ShipmentStageTimeline
                        stages={stages}
                        current={current}
                        tone={tone}
                        advancingTo={next.stage}
                      />
                      <p className="flex flex-wrap items-center justify-center gap-1.5 text-center text-sm">
                        <span className="text-muted-foreground">
                          {current ? STAGE_LABELS[current] : "Sin iniciar"}
                        </span>
                        <ArrowRight className="size-3.5 text-muted-foreground" />
                        <span className="font-medium">
                          {STAGE_LABELS[next.stage]}
                        </span>
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">
                        Se registra en el historial como
                      </Label>
                      <Select
                        value={code || STEP_DEFAULT}
                        onValueChange={(v) =>
                          setCode(v === STEP_DEFAULT ? "" : v)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={STEP_DEFAULT}>
                            {next.label}
                          </SelectItem>
                          {stageEvents
                            .filter((e) => e.code !== next.eventCode)
                            .map((option) => (
                              <SelectItem key={option.code} value={option.code}>
                                {option.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs">Etapa</Label>
                      <ShipmentStageTimeline
                        stages={stages}
                        current={current}
                        tone={tone}
                        focused={activeStage}
                        onFocus={pickStage}
                      />
                    </div>

                    {activeStage && (
                      <div className="space-y-1.5">
                        <Label className="text-xs">
                          Evento de {STAGE_LABELS[activeStage]}
                        </Label>
                        <Select value={code} onValueChange={setCode}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Elige qué pasó" />
                          </SelectTrigger>
                          <SelectContent>
                            {stageEvents.map((option) => (
                              <SelectItem key={option.code} value={option.code}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </>
                )}

                {((mode === "advance" && next) || (mode === "note" && chosen)) && (
                  <>
                    {required && (
                      <div className="space-y-3 rounded-md border p-3">
                        <p className="text-xs font-medium">
                          Requerido para este paso
                        </p>
                        {needs.recipient && (
                          <div className="space-y-1.5">
                            <Label htmlFor="event-recipient" className="text-xs">
                              Nombre de quien recibe <RequiredMark />
                            </Label>
                            <Input
                              id="event-recipient"
                              value={recipientName}
                              aria-invalid={!recipientName.trim()}
                              onChange={(e) => setRecipientName(e.target.value)}
                            />
                          </div>
                        )}
                        {needs.warehouse && warehouseField(true)}
                        {needs.photo && (
                          <MissingFrame missing={photos.length === 0}>
                            {photosField("Fotos (al menos una) *")}
                          </MissingFrame>
                        )}
                        {needs.signature && (
                          <MissingFrame missing={signature.length === 0}>
                            {signatureField("Firma *")}
                          </MissingFrame>
                        )}
                      </div>
                    )}

                    {/* El mismo patrón que los grupos de permisos: la fila
                        entera abre y cierra, y dice cuánto ya se llenó para no
                        perderlo de vista al cerrarla. */}
                    <div className="rounded-md border">
                      <button
                        type="button"
                        onClick={() => setDetailsOpen((v) => !v)}
                        aria-expanded={detailsOpen}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-muted/50"
                      >
                        <ChevronRight
                          className={cn(
                            "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                            detailsOpen && "rotate-90",
                          )}
                        />
                        <span className="flex-1 text-sm font-medium">
                          Agregar detalles{" "}
                          <span className="font-normal text-muted-foreground">
                            (opcional)
                          </span>
                        </span>
                        {detailsCount > 0 && (
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {detailsCount}{" "}
                            {detailsCount === 1 ? "agregado" : "agregados"}
                          </span>
                        )}
                      </button>

                      {detailsOpen && (
                        <div className="space-y-3 border-t p-3">
                          <div className="space-y-1.5">
                            <Label htmlFor="event-occurred-at" className="text-xs">
                              Fecha y hora
                            </Label>
                            <DateTimePicker
                              id="event-occurred-at"
                              value={occurredAt}
                              onChange={setOccurredAt}
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor="event-notes" className="text-xs">
                              Observaciones
                            </Label>
                            <Textarea
                              id="event-notes"
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              placeholder="Ej. Caja sin daño visible"
                              rows={2}
                            />
                          </div>

                          {optional.photo && photosField("Fotos")}
                          {optional.signature && signatureField("Firma")}
                          {optional.warehouse && warehouseField(false)}

                          {optional.dispatch && (
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="space-y-1.5">
                                <Label className="text-xs">Tipo de salida</Label>
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
                                    {shippingModes.map((value) => (
                                      <SelectItem key={value} value={value}>
                                        {SHIPPING_MODE_LABELS[value]}
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
                                  Consolidado
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
                        </div>
                      )}
                    </div>

                  </>
                )}
              </>
            )}
          </div>

          <DialogFooter className="items-center">
            {missing.length > 0 && !isLoading && (
              <p className="mr-auto text-xs text-muted-foreground">
                Falta {missing.join(", ")}.
              </p>
            )}
            <Button
              variant="outline"
              onClick={closeAndReset}
              disabled={isRecordingEvent}
            >
              Volver
            </Button>
            <Button onClick={handleSubmit} disabled={!canSubmit || isLoading}>
              {isRecordingEvent
                ? "Guardando..."
                : mode === "advance" && next
                  ? `Avanzar a ${STAGE_LABELS[next.stage]}`
                  : "Registrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

/** El asterisco de un campo que el paso exige. */
const RequiredMark = () => <span className="text-destructive">*</span>;

/**
 * Rojo mientras falte lo que el paso exige, como un `Input` con
 * `aria-invalid`: la foto y la firma no tienen ese estado propio.
 */
const MissingFrame = ({
  missing,
  children,
}: {
  missing: boolean;
  children: ReactNode;
}) => (
  <div
    className={cn(
      "rounded-md border p-2 transition-colors",
      missing ? "border-destructive bg-destructive/5" : "border-transparent",
    )}
  >
    {children}
  </div>
);
