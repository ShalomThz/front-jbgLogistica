import { Pencil, Trash2, MapPin, Navigation } from "lucide-react";
import {
  Badge,
  Separator,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from "@contexts/shared/shadcn";
import type { RoutePrimitives, RouteStatus } from "../../../domain/schemas/route/RouteDelivery";

const STATUS_LABELS: Record<RouteStatus, string> = {
  PLANNED: "Planeada",
  ACTIVE: "Activa",
  COMPLETED: "Completada",
};

const STATUS_VARIANT: Record<RouteStatus, "default" | "secondary" | "outline"> = {
  PLANNED: "outline",
  ACTIVE: "secondary",
  COMPLETED: "default",
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="col-span-2 text-sm">{value}</span>
    </div>
  );
}

const formatDateTime = (date: string) =>
  new Date(date).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

interface Props {
  route: RoutePrimitives | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (route: RoutePrimitives) => void;
  onDelete?: (route: RoutePrimitives) => void;
}

export const DeliveryRouteDetailDialog = ({ route, open, onClose, onEdit, onDelete }: Props) => {
  if (!route) return null;
  const completedStops = route.stops.filter((s) => s.isCompleted).length;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg pt-8">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Navigation className="size-5" />
              Ruta {route.id}
            </span>
            <Badge variant={STATUS_VARIANT[route.status]}>{STATUS_LABELS[route.status]}</Badge>
          </DialogTitle>
          <DialogDescription>Creada el {formatDateTime(route.createdAt)}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Información</h4>
            <div className="rounded-md border p-3 space-y-1">
              <DetailRow label="ID" value={route.id} />
              <DetailRow label="Conductor ID" value={route.driverId} />
              <DetailRow label="Estado" value={STATUS_LABELS[route.status]} />
              <DetailRow label="Paradas" value={`${completedStops}/${route.stops.length} completadas`} />
              {route.finishDate && (
                <DetailRow label="Fecha fin" value={formatDateTime(route.finishDate.toString())} />
              )}
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Origen</h4>
            <div className="rounded-md border p-3 space-y-1">
              <DetailRow label="Latitud" value={route.origin.latitude.toFixed(6)} />
              <DetailRow label="Longitud" value={route.origin.longitude.toFixed(6)} />
              {route.origin.placeId && <DetailRow label="Place ID" value={route.origin.placeId} />}
            </div>
          </div>
          {route.mapsMetadata && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Información de Ruta</h4>
                <div className="rounded-md border p-3 space-y-1">
                  <DetailRow label="Distancia" value={`${route.mapsMetadata.distanceKm.toFixed(1)} km`} />
                  <DetailRow label="Duración" value={`${route.mapsMetadata.durationMinutes} min`} />
                </div>
              </div>
            </>
          )}
          {route.stops.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Paradas ({route.stops.length})</h4>
                <div className="rounded-md border divide-y max-h-40 overflow-y-auto">
                  {route.stops.map((stop) => (
                    <div key={stop.id} className="p-2 flex items-center gap-2">
                      <MapPin className={`size-4 ${stop.isCompleted ? "text-green-500" : "text-muted-foreground"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">#{stop.stopOrder} - {stop.orderId}</p>
                        <p className="text-xs text-muted-foreground truncate">{stop.address.address1}, {stop.address.city}</p>
                      </div>
                      {stop.isCompleted && <Badge variant="default" className="text-xs">Completada</Badge>}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          <Separator />
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Auditoría</h4>
            <div className="rounded-md border p-3 space-y-1">
              <DetailRow label="Creado" value={formatDateTime(route.createdAt)} />
              <DetailRow label="Actualizado" value={formatDateTime(route.updatedAt)} />
            </div>
          </div>
        </div>
        {(onEdit || onDelete) && (
          <DialogFooter>
            {onDelete && (
              <Button variant="outline" size="sm" onClick={() => onDelete(route)}>
                <Trash2 className="mr-1.5 size-4" />
                Eliminar
              </Button>
            )}
            {onEdit && (
              <Button size="sm" onClick={() => onEdit(route)}>
                <Pencil className="mr-1.5 size-4" />
                Editar
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
