import { useState } from "react";
import { toast } from "sonner";
import { Ban, CheckCircle2, Clock, Loader2, MapPin, Navigation, Package, Route, Trash2, User, XCircle } from "lucide-react";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Progress,
  Separator,
} from "@contexts/shared/shadcn";
import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { orderPolicies } from "@contexts/shared/domain/policies/order.policy";
import { parseApiError } from "@contexts/shared/infrastructure/http";
import { orderRepository } from "@contexts/sales/infrastructure/services/orders/orderRepository";
import type { OrderListView } from "@contexts/sales/domain/schemas/order/OrderListViewSchemas";
import { OrderDetailDialog } from "@contexts/order-flow/ui/components/order/detail/OrderDetailDialog";
import type { RoutePrimitives, RouteStatus } from "../../../domain/schemas/route/Route";
import type { RouteStopPrimitives } from "../../../domain/schemas/route/RouteStop";
import { ROUTE_TYPE_COPY } from "../../../domain/schemas/route/routeTypeCopy";
import type { DriverListViewPrimitives } from "../../../domain/schemas/driver/DriverListView";
import { StopEvidenceDialog } from "./StopEvidenceDialog";

const STATUS_LABELS: Record<RouteStatus, string> = {
  PLANNED: "Planificada",
  ACTIVE: "Activa",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
};

const STATUS_VARIANT: Record<RouteStatus, "default" | "secondary" | "outline" | "destructive"> = {
  PLANNED: "outline",
  ACTIVE: "secondary",
  COMPLETED: "default",
  CANCELLED: "destructive",
};

const STOP_STATUS_COLORS: Record<string, string> = {
  PENDING: "text-muted-foreground",
  DELIVERED: "text-green-500",
  FAILED: "text-destructive",
  RETURNED: "text-orange-500",
};

const STOP_STATUS_ICON: Record<string, React.ElementType> = {
  PENDING: Clock,
  DELIVERED: CheckCircle2,
  FAILED: XCircle,
  RETURNED: Ban,
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-0.5">
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
  driver?: DriverListViewPrimitives;
  onDelete?: (route: RoutePrimitives) => void;
  onPermanentDelete?: (route: RoutePrimitives) => void;
  onMap?: (route: RoutePrimitives) => void;
}

export const DeliveryRouteDetailDialog = ({
  route,
  open,
  onClose,
  driver,
  onDelete,
  onPermanentDelete,
  onMap,
}: Props) => {
  const [selectedStop, setSelectedStop] = useState<RouteStopPrimitives | null>(null);
  const [orderForStop, setOrderForStop] = useState<OrderListView | null>(null);
  const [loadingOrderStopId, setLoadingOrderStopId] = useState<string | null>(null);
  const { user } = useAuth();
  const canViewOrder = user ? orderPolicies.list(user) : false;

  const handleViewOrder = async (stop: RouteStopPrimitives) => {
    setLoadingOrderStopId(stop.id);
    try {
      const { data } = await orderRepository.find({
        filters: [{ field: "shipment.id", filterOperator: "=", value: stop.shipmentId }],
        limit: 1,
        offset: 0,
      });
      if (data[0]) {
        setOrderForStop(data[0]);
      } else {
        toast.error("No se encontró la orden asociada a este envío.");
      }
    } catch (e) {
      toast.error(parseApiError(e));
    } finally {
      setLoadingOrderStopId(null);
    }
  };

  if (!route) return null;

  const copy = ROUTE_TYPE_COPY[route.type];
  const stopStatusLabels: Record<string, string> = {
    PENDING: "Pendiente",
    DELIVERED: copy.stopStatusDelivered,
    FAILED: "Fallida",
    RETURNED: "Devuelta",
  };

  const delivered = route.stops.filter((s) => s.status === "DELIVERED").length;
  const failed = route.stops.filter(
    (s) => s.status === "FAILED" || s.status === "RETURNED",
  ).length;
  const pending = route.stops.filter((s) => s.status === "PENDING").length;
  const total = route.stops.length;
  const progress = total > 0 ? Math.round((delivered / total) * 100) : 0;
  const shortId = route.id.slice(0, 8).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto pt-8">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <Navigation className="size-5 text-primary shrink-0" />
              <span className="font-mono text-base">#{shortId}</span>
            </span>
            <Badge variant={STATUS_VARIANT[route.status]}>
              {STATUS_LABELS[route.status]}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Creada el {formatDateTime(route.createdAt)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Driver & general info */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Información general</h4>
            <div className="rounded-md border p-3 space-y-1">
              <DetailRow
                label="Conductor"
                value={
                  driver ? (
                    <span className="flex items-center gap-1.5">
                      <User className="size-3.5 text-muted-foreground" />
                      <span className="font-medium">{driver.user.name}</span>
                      <span className="text-muted-foreground text-xs">
                        · {driver.licenseNumber}
                      </span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs font-mono">
                      {route.driverId}
                    </span>
                  )
                }
              />
              <DetailRow label="Estado" value={STATUS_LABELS[route.status]} />
              {route.finishDate && (
                <DetailRow
                  label="Finalizada"
                  value={formatDateTime(route.finishDate)}
                />
              )}
            </div>
          </div>

          {/* Progress summary */}
          {total > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">{copy.progressTitle}</h4>
                <div className="rounded-md border p-3 space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{delivered}/{total} paradas {copy.stopsDoneLabel}</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-md bg-green-50 p-2 text-green-700">
                      <p className="font-semibold text-base">{delivered}</p>
                      <p>{copy.deliveredStatLabel}</p>
                    </div>
                    <div className="rounded-md bg-muted p-2 text-muted-foreground">
                      <p className="font-semibold text-base">{pending}</p>
                      <p>Pendientes</p>
                    </div>
                    <div className="rounded-md bg-red-50 p-2 text-red-700">
                      <p className="font-semibold text-base">{failed}</p>
                      <p>Fallidas</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Maps metadata */}
          {route.mapsMetadata && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Ruta optimizada</h4>
                <div className="rounded-md border p-3 grid grid-cols-2 gap-3 text-center text-xs">
                  <div className="space-y-0.5">
                    <p className="text-2xl font-bold text-primary">
                      {route.mapsMetadata.distanceKm.toFixed(1)}
                    </p>
                    <p className="text-muted-foreground">km totales</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-2xl font-bold text-primary">
                      {Math.round(route.mapsMetadata.durationMinutes)}
                    </p>
                    <p className="text-muted-foreground">min estimados</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Origin */}
          <Separator />
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Punto de salida</h4>
            <div className="rounded-md border p-3 space-y-1">
              <DetailRow
                label="Coordenadas"
                value={`${route.origin.latitude.toFixed(5)}, ${route.origin.longitude.toFixed(5)}`}
              />
            </div>
          </div>

          {/* Stops list */}
          {route.stops.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">
                  Paradas ({route.stops.length})
                </h4>
                <div className="rounded-md border divide-y max-h-52 overflow-y-auto">
                  {route.stops
                    .slice()
                    .sort((a, b) => a.stopOrder - b.stopOrder)
                    .map((stop) => {
                      const Icon = STOP_STATUS_ICON[stop.status] ?? MapPin;
                      const colorClass = STOP_STATUS_COLORS[stop.status] ?? "text-muted-foreground";
                      return (
                        <div
                          key={stop.id}
                          className="w-full flex items-start gap-3 p-2.5 hover:bg-muted/50 transition-colors"
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedStop(stop)}
                            className="flex flex-1 min-w-0 items-start gap-3 text-left"
                          >
                            <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                              <span className="font-mono text-[11px] text-muted-foreground w-4 text-right">
                                {stop.stopOrder}
                              </span>
                              <Icon className={`size-4 ${colorClass}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">
                                {stop.address.address1}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {stop.address.city}, {stop.address.province}
                              </p>
                              {stop.attempts.length > 0 && (
                                <p className="text-[11px] text-muted-foreground mt-0.5 underline decoration-dotted">
                                  Ver evidencia · {stop.attempts.length} intento
                                  {stop.attempts.length !== 1 ? "s" : ""}
                                </p>
                              )}
                            </div>
                          </button>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Badge
                              variant={
                                stop.status === "DELIVERED"
                                  ? "default"
                                  : stop.status === "FAILED" || stop.status === "RETURNED"
                                    ? "destructive"
                                    : "secondary"
                              }
                              className="text-[10px]"
                            >
                              {stopStatusLabels[stop.status] ?? stop.status}
                            </Badge>
                            {canViewOrder && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-6"
                                title="Ver orden"
                                disabled={loadingOrderStopId === stop.id}
                                onClick={() => handleViewOrder(stop)}
                              >
                                {loadingOrderStopId === stop.id ? (
                                  <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                  <Package className="size-3.5" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </>
          )}

          {/* Audit */}
          <Separator />
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Auditoría</h4>
            <div className="rounded-md border p-3 space-y-1">
              <DetailRow label="Creada" value={formatDateTime(route.createdAt)} />
              <DetailRow
                label="Actualizada"
                value={formatDateTime(route.updatedAt)}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          {onMap && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onMap(route)}
              className="gap-1.5"
            >
              <Route className="size-4" />
              Ver mapa
            </Button>
          )}
          {onDelete &&
            route.status !== "COMPLETED" &&
            route.status !== "CANCELLED" && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-destructive hover:text-destructive"
                onClick={() => onDelete(route)}
              >
                <Trash2 className="size-4" />
                Cancelar ruta
              </Button>
            )}
          {onPermanentDelete &&
            (route.status === "PLANNED" || route.status === "CANCELLED") && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-destructive hover:text-destructive"
                onClick={() => onPermanentDelete(route)}
              >
                <Trash2 className="size-4" />
                Eliminar permanentemente
              </Button>
            )}
        </DialogFooter>
      </DialogContent>

      <StopEvidenceDialog
        stop={selectedStop}
        routeType={route.type}
        open={!!selectedStop}
        onClose={() => setSelectedStop(null)}
      />

      <OrderDetailDialog
        order={orderForStop}
        open={!!orderForStop}
        onClose={() => setOrderForStop(null)}
      />
    </Dialog>
  );
};
