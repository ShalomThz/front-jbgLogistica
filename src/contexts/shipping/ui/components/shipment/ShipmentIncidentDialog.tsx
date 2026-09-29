import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { shippingPolicies } from "@contexts/shared/domain/policies/shipping.policy";
import { TONE_CALLOUT } from "@contexts/shared/domain/schemas/StatusTone";
import { parseApiError } from "@contexts/shared/infrastructure/http/errors";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import type { ShipmentIncidentPrimitives } from "@contexts/shipping/domain/schemas/shipment/Shipment";
import {
  INCIDENT_LABELS,
  shipmentIncidentTypes,
  type ShipmentIncidentType,
} from "@contexts/shipping/domain/schemas/shipment/ShipmentStages";
import { useShipmentActions } from "@contexts/shipping/infrastructure/hooks/shipments/useShipments";
import { CircleCheck, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  shipmentId: string;
  /** La incidencia abierta, si hay una: decide si el diálogo abre o resuelve. */
  incident: ShipmentIncidentPrimitives | null;
}

/**
 * Abre o resuelve una incidencia (guía, §2): retenido, dirección incorrecta,
 * daño reportado… Es una capa encima del recorrido —no mueve la etapa— y hay
 * una sola abierta a la vez, así que el mismo botón hace una cosa u otra.
 *
 * El motivo es obligatorio al abrir, y al resolver se dice cómo: las dos cosas
 * quedan en el historial.
 */
export const ShipmentIncidentDialog = ({ shipmentId, incident }: Props) => {
  const { user } = useAuth();
  const { openShipmentIncident, resolveShipmentIncident, isSavingIncident } =
    useShipmentActions();

  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ShipmentIncidentType | "">("");
  const [text, setText] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);

  if (!user || !shippingPolicies.recordEvents(user)) return null;

  const closeAndReset = () => {
    setOpen(false);
    setType("");
    setText("");
    setPhotos([]);
  };

  const canSubmit =
    !!text.trim() && (!!incident || !!type) && !isSavingIncident;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      if (incident) {
        await resolveShipmentIncident({ shipmentId, resolution: text.trim() });
        toast.success("Incidencia resuelta");
      } else if (type) {
        await openShipmentIncident({
          shipmentId,
          type,
          reason: text.trim(),
          photos: photos.length > 0 ? photos : undefined,
        });
        toast.success(`Incidencia abierta: ${INCIDENT_LABELS[type]}`);
      }
      closeAndReset();
    } catch (error) {
      toast.error(parseApiError(error));
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5 text-xs"
        onClick={() => setOpen(true)}
      >
        {incident ? (
          <CircleCheck className="size-3.5" />
        ) : (
          <TriangleAlert className="size-3.5" />
        )}
        {incident ? "Resolver incidencia" : "Incidencia"}
      </Button>

      <Dialog open={open} onOpenChange={(v) => !v && closeAndReset()}>
        <DialogContent className="flex max-h-[90dvh] flex-col gap-4 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {incident ? "Resolver incidencia" : "Abrir incidencia"}
            </DialogTitle>
            <DialogDescription>
              {incident
                ? "El recorrido sigue desde donde estaba, y la incidencia queda en el historial."
                : "No mueve la etapa del envío: queda marcada encima hasta que se resuelva."}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 min-w-0 flex-1 space-y-3 overflow-y-auto">
            {incident ? (
              <p
                className={cn(
                  "flex items-start gap-1.5 rounded-md p-2 text-xs",
                  TONE_CALLOUT.stopped,
                )}
              >
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  <span className="font-medium">
                    {INCIDENT_LABELS[incident.type]}
                  </span>{" "}
                  — {incident.reason}
                </span>
              </p>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-xs">Tipo</Label>
                <Select
                  value={type}
                  onValueChange={(v) => setType(v as ShipmentIncidentType)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Elige el tipo de incidencia" />
                  </SelectTrigger>
                  <SelectContent>
                    {shipmentIncidentTypes.map((t) => (
                      <SelectItem key={t} value={t}>
                        {INCIDENT_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="incident-text" className="text-xs">
                {incident ? "Cómo se resolvió" : "Motivo"}
              </Label>
              <Textarea
                id="incident-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
              />
            </div>

            {!incident && (
              <CameraPhotoInput
                id="incident-photo"
                label="Fotos (opcional)"
                cameraTitle="Fotos de la incidencia"
                value={photos}
                onChange={setPhotos}
                max={MAX_EVIDENCE_PHOTOS}
              />
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeAndReset}
              disabled={isSavingIncident}
            >
              Volver
            </Button>
            <Button onClick={handleSubmit} disabled={!canSubmit}>
              {isSavingIncident
                ? "Guardando..."
                : incident
                  ? "Resolver"
                  : "Abrir incidencia"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
