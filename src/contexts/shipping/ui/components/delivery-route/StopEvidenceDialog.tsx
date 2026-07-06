import { MapPin } from "lucide-react";
import {
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Separator,
} from "@contexts/shared/shadcn";
import { useMedia } from "@contexts/shared/infrastructure/hooks/media/useMedia";
import type { DeliveryAttemptPrimitives } from "../../../domain/schemas/route/DeliveryAttempt";
import type { RouteStopPrimitives } from "../../../domain/schemas/route/RouteStop";

const OUTCOME_LABELS: Record<DeliveryAttemptPrimitives["outcome"], string> = {
  DELIVERED: "Entregado",
  FAILED: "Fallido",
};

const formatDateTime = (date: string) =>
  new Date(date).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-0.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="col-span-2 text-sm">{value}</span>
    </div>
  );
}

function AttemptEvidenceCard({ attempt }: { attempt: DeliveryAttemptPrimitives }) {
  const { data: photo, isLoading: isLoadingPhoto } = useMedia(attempt.photoPath);

  return (
    <div className="rounded-md border p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">Intento {attempt.attemptNumber}</span>
        <Badge variant={attempt.outcome === "DELIVERED" ? "default" : "destructive"}>
          {OUTCOME_LABELS[attempt.outcome]}
        </Badge>
      </div>
      <div className="space-y-1">
        <DetailRow label="Registrado" value={formatDateTime(attempt.clientTimestamp)} />
        <DetailRow label="Recibido" value={formatDateTime(attempt.serverTimestamp)} />
        <DetailRow
          label="Ubicación"
          value={
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5 text-muted-foreground shrink-0" />
              {attempt.gpsLocation.latitude.toFixed(5)}, {attempt.gpsLocation.longitude.toFixed(5)}
            </span>
          }
        />
        {attempt.reason && <DetailRow label="Motivo" value={attempt.reason} />}
      </div>
      <div className="space-y-1.5">
        <span className="text-sm text-muted-foreground">Evidencia fotográfica</span>
        {isLoadingPhoto ? (
          <div className="text-sm text-muted-foreground animate-pulse">Cargando foto...</div>
        ) : photo?.url ? (
          <img
            src={photo.url}
            alt={`Evidencia intento ${attempt.attemptNumber}`}
            className="max-h-64 w-auto rounded-md border object-contain"
          />
        ) : (
          <div className="text-sm text-muted-foreground">Foto no disponible</div>
        )}
      </div>
    </div>
  );
}

interface Props {
  stop: RouteStopPrimitives | null;
  open: boolean;
  onClose: () => void;
}

export const StopEvidenceDialog = ({ stop, open, onClose }: Props) => {
  if (!stop) return null;

  const attempts = stop.attempts.slice().sort((a, b) => a.attemptNumber - b.attemptNumber);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto pt-8">
        <DialogHeader>
          <DialogTitle>{stop.address.address1}</DialogTitle>
          <DialogDescription>
            {stop.address.city}, {stop.address.province}
          </DialogDescription>
        </DialogHeader>

        {attempts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aún no se han registrado intentos de entrega para esta parada.
          </p>
        ) : (
          <div className="space-y-3">
            {attempts.map((attempt, index) => (
              <div key={`${attempt.attemptNumber}-${attempt.clientTimestamp}`}>
                {index > 0 && <Separator className="mb-3" />}
                <AttemptEvidenceCard attempt={attempt} />
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
