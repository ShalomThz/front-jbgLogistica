import {
  Badge,
  Button,
  Card,
  CardContent,
  Progress,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@contexts/shared/shadcn";
import { PageLoader } from "@contexts/shared/ui/components/PageLoader";
import {
  Ban,
  Box,
  CheckCircle2,
  ChevronDown,
  Clock,
  MapPin,
  Navigation,
  PackageOpen,
  Plus,
  RefreshCw,
  Route,
  Trash2,
  Truck,
  User,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { cn } from "@contexts/shared/shadcn/lib/utils";
import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { shippingPolicies } from "@contexts/shared/domain/policies/shipping.policy";
import { parseApiError } from "../../../shared/infrastructure/http";
import type { CreateRouteRequest } from "../../application/route/CreateRouteRequest";
import type { RouteResponsePrimitives } from "../../application/route/RouteResponse";
import type { DriverListViewPrimitives } from "../../domain/schemas/driver/DriverListView";
import type { RouteStatus, RouteType } from "../../domain/schemas/route/Route";
import { ROUTE_TYPE_COPY } from "../../domain/schemas/route/routeTypeCopy";
import { useDrivers } from "../../infrastructure/hooks/drivers/useDrivers";
import { useRoutes } from "../../infrastructure/hooks/routes/useRoutes";
import { CreateRouteDialog } from "../components/delivery-route/CreateRouteDialog";
import { DeliveryRouteDeleteDialog } from "../components/delivery-route/DeliveryRouteDeleteDialog";
import { DeliveryRouteDetailDialog } from "../components/delivery-route/DeliveryRouteDetailDialog";
import { DeliveryRoutePermanentDeleteDialog } from "../components/delivery-route/DeliveryRoutePermanentDeleteDialog";
import { RouteMapDialog } from "../components/route/RouteMapDialog";

const STATUS_LABELS: Record<RouteStatus, string> = {
  PLANNED: "Planificada",
  ACTIVE: "Activa",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
};

// Misma paleta que las StatCards: ámbar/azul/verde/rojo por estatus
const STATUS_BADGE_CLASS: Record<RouteStatus, string> = {
  PLANNED:
    "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  ACTIVE:
    "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
  COMPLETED:
    "border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950/40 dark:text-green-400",
  CANCELLED:
    "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950/40 dark:text-red-400",
};

const ALL_TABS = [
  "ALL",
  "PLANNED",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
] as const;
type Tab = (typeof ALL_TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
  ALL: "Todas",
  PLANNED: "Planificadas",
  ACTIVE: "Activas",
  COMPLETED: "Completadas",
  CANCELLED: "Canceladas",
};

const LIMIT = 50;

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatCard({
  label,
  value,
  icon: Icon,
  colorClass,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  colorClass: string;
}) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className={`rounded-full p-3 bg-muted ${colorClass}`}>
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}

interface RouteCardProps {
  route: RouteResponsePrimitives;
  driver: DriverListViewPrimitives | undefined;
  onDetail: () => void;
  onMap: () => void;
  onOptimize: () => void;
  onCancel: () => void;
  onPermanentDelete: () => void;
  isOptimizing: boolean;
  canCancelRoutes: boolean;
  canDeleteRoutes: boolean;
}

function RouteCard({
  route,
  driver,
  onDetail,
  onMap,
  onOptimize,
  onCancel,
  onPermanentDelete,
  isOptimizing,
  canCancelRoutes,
  canDeleteRoutes,
}: RouteCardProps) {
  const delivered = route.stops.filter((s) => s.status === "DELIVERED").length;
  const total = route.stops.length;
  const failed = route.stops.filter(
    (s) => s.status === "FAILED" || s.status === "RETURNED",
  ).length;
  const progress = total > 0 ? Math.round((delivered / total) * 100) : 0;
  // Optimizar no exige permiso: cualquier usuario puede hacerlo.
  const canOptimize = route.status === "PLANNED" && total > 0;
  const canCancel =
    canCancelRoutes &&
    route.status !== "COMPLETED" &&
    route.status !== "CANCELLED";
  // Cualquier estatus salvo ACTIVE: una ruta en curso primero se cancela.
  const canPermanentlyDelete = canDeleteRoutes && route.status !== "ACTIVE";
  const shortId = route.id.slice(0, 8).toUpperCase();

  return (
    <Card
      className={cn(
        "hover:shadow-md transition-shadow flex flex-col border-l-4",
        // Borde por estatus (misma paleta que el badge), no por módulo
        route.status === "PLANNED" &&
          "border-l-amber-400 dark:border-l-amber-600",
        route.status === "ACTIVE" && "border-l-blue-400 dark:border-l-blue-600",
        route.status === "COMPLETED" &&
          "border-l-green-400 dark:border-l-green-600",
        route.status === "CANCELLED" &&
          "border-l-red-400 dark:border-l-red-600",
      )}
    >
      <CardContent className="p-5 flex flex-col gap-4 flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5 min-w-0">
            <p className="font-mono text-[11px] text-muted-foreground tracking-wide">
              #{shortId}
            </p>
            <h3 className="font-semibold text-sm leading-tight truncate">
              {driver ? driver.user.name : "Sin conductor asignado"}
            </h3>
            {driver && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <User className="size-3 shrink-0" />
                {driver.licenseNumber}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge variant="outline" className={STATUS_BADGE_CLASS[route.status]}>
              {STATUS_LABELS[route.status]}
            </Badge>
            {/* Misma paleta que las pestañas de módulo: azul/celeste/ámbar */}
            <Badge
              variant="outline"
              className={
                route.type === "DELIVERY"
                  ? "gap-1 border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-400"
                  : route.type === "PICKING"
                    ? "gap-1 border-sky-300 text-sky-700 dark:border-sky-700 dark:text-sky-400"
                    : "gap-1 border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400"
              }
            >
              {route.type === "DELIVERY" ? (
                <Truck className="size-3" />
              ) : (
                <PackageOpen className="size-3" />
              )}
              {route.type === "PICKING"
                ? "Recolección"
                : route.type === "BOX_DROP"
                  ? "Caja vacía"
                  : "Entrega"}
            </Badge>
          </div>
        </div>

        {/* Progress */}
        {total > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {delivered}/{total} {ROUTE_TYPE_COPY[route.type].stopsDoneLabel}
                {failed > 0 && (
                  <span className="text-destructive ml-2">
                    · {failed} fallida{failed !== 1 ? "s" : ""}
                  </span>
                )}
              </span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}

        {total === 0 && (
          <p className="text-xs text-muted-foreground italic">
            Sin paradas — agrega envíos para optimizar
          </p>
        )}

        {/* Metadata */}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {route.mapsMetadata ? (
            <>
              <span className="flex items-center gap-1">
                <MapPin className="size-3" />
                {route.mapsMetadata.distanceKm.toFixed(1)} km
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                {Math.round(route.mapsMetadata.durationMinutes)} min estimados
              </span>
            </>
          ) : (
            <span className="flex items-center gap-1 italic">
              <MapPin className="size-3" />
              Sin optimizar
            </span>
          )}
          <span className="flex items-center gap-1 ml-auto">
            <Clock className="size-3" />
            {formatDate(route.createdAt)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-1.5 pt-3 border-t mt-auto">
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1.5 text-xs"
            onClick={onDetail}
          >
            <Navigation className="size-3.5" />
            Detalle
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1.5 text-xs"
            onClick={onMap}
          >
            <Route className="size-3.5" />
            Mapa
          </Button>
          {canOptimize && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1.5 text-xs"
              onClick={onOptimize}
              disabled={isOptimizing}
            >
              <Zap className="size-3.5" />
              {isOptimizing ? "Optimizando…" : "Optimizar"}
            </Button>
          )}
          {canCancel && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 ml-auto"
              onClick={onCancel}
            >
              <Ban className="size-3.5" />
              Cancelar
            </Button>
          )}
          {canPermanentlyDelete && (
            <Button
              size="sm"
              variant="outline"
              className={`h-7 gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 ${canCancel ? "" : "ml-auto"}`}
              onClick={onPermanentDelete}
            >
              <Trash2 className="size-3.5" />
              Eliminar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface RoutesPageProps {
  routeType: RouteType;
}

export const RoutesPage = ({ routeType: routeKind }: RoutesPageProps) => {
  const [activeTab, setActiveTab] = useState<Tab>("ALL");
  const [statsOpen, setStatsOpen] = useState(true);
  const [selectedRoute, setSelectedRoute] =
    useState<RouteResponsePrimitives | null>(null);
  const [routeToCancel, setRouteToCancel] =
    useState<RouteResponsePrimitives | null>(null);
  const [routeToDeletePermanently, setRouteToDeletePermanently] =
    useState<RouteResponsePrimitives | null>(null);
  const [mapRoute, setMapRoute] = useState<RouteResponsePrimitives | null>(
    null,
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [optimizingId, setOptimizingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [deletingPermanentlyId, setDeletingPermanentlyId] = useState<
    string | null
  >(null);

  const { user } = useAuth();
  const canCreateRoutes = user ? shippingPolicies.createRoutes(user) : false;
  const canCancelRoutes = user ? shippingPolicies.cancelRoutes(user) : false;
  const canDeleteRoutes = user ? shippingPolicies.deleteRoutes(user) : false;

  const {
    routes,
    isLoading,
    refetch,
    createRoute,
    isCreatingRoute,
    optimizeRoute,
    cancelRoute,
    deleteRoutePermanently,
  } = useRoutes({ filters: [], page: 1, limit: LIMIT });

  // Fetch all drivers to resolve names from driverId
  const { drivers } = useDrivers({ filters: [] });
  const driverMap = useMemo(
    () => new Map(drivers.map((d) => [d.id, d])),
    [drivers],
  );

  // Cada página muestra solo las rutas de su módulo (entrega/recolección/cajas)
  const typedRoutes = useMemo(
    () => routes.filter((r) => r.type === routeKind),
    [routes, routeKind],
  );

  const counts = useMemo(
    () => ({
      total: typedRoutes.length,
      planned: typedRoutes.filter((r) => r.status === "PLANNED").length,
      active: typedRoutes.filter((r) => r.status === "ACTIVE").length,
      completed: typedRoutes.filter((r) => r.status === "COMPLETED").length,
      cancelled: typedRoutes.filter((r) => r.status === "CANCELLED").length,
    }),
    [typedRoutes],
  );

  const filteredRoutes = useMemo(() => {
    if (activeTab === "ALL") return typedRoutes;
    return typedRoutes.filter((r) => r.status === activeTab);
  }, [typedRoutes, activeTab]);

  const alreadyRoutedShipmentIds = useMemo(
    () =>
      new Set(
        routes
          .filter((r) => r.status === "PLANNED" || r.status === "ACTIVE")
          .flatMap((r) => r.stops.map((s) => s.shipmentId)),
      ),
    [routes],
  );

  const handleOptimize = async (route: RouteResponsePrimitives) => {
    setOptimizingId(route.id);
    try {
      const optimized = await optimizeRoute(route.id);
      const meta = optimized.mapsMetadata;
      toast.success(
        meta
          ? `Ruta optimizada · ${meta.distanceKm.toFixed(1)} km · ${Math.round(meta.durationMinutes)} min`
          : "Ruta optimizada",
      );
      setMapRoute(optimized);
    } catch (e) {
      toast.error(parseApiError(e));
    } finally {
      setOptimizingId(null);
    }
  };

  const handleCancelConfirm = async () => {
    if (!routeToCancel) return;
    setCancellingId(routeToCancel.id);
    try {
      await cancelRoute(routeToCancel.id);
      toast.success("Ruta cancelada");
      setRouteToCancel(null);
    } catch (e) {
      toast.error(parseApiError(e));
    } finally {
      setCancellingId(null);
    }
  };

  const handleDeletePermanentlyConfirm = async () => {
    if (!routeToDeletePermanently) return;
    setDeletingPermanentlyId(routeToDeletePermanently.id);
    try {
      await deleteRoutePermanently(routeToDeletePermanently.id);
      toast.success("Ruta eliminada permanentemente");
      setRouteToDeletePermanently(null);
    } catch (e) {
      toast.error(parseApiError(e));
    } finally {
      setDeletingPermanentlyId(null);
    }
  };

  const handleCreate = async (data: CreateRouteRequest) => {
    try {
      await createRoute(data);
      toast.success("Ruta creada correctamente");
      setCreateOpen(false);
    } catch (e) {
      toast.error(parseApiError(e));
    }
  };

  if (isLoading) return <PageLoader />;

  const tabCountMap: Record<Tab, number> = {
    ALL: counts.total,
    PLANNED: counts.planned,
    ACTIVE: counts.active,
    COMPLETED: counts.completed,
    CANCELLED: counts.cancelled,
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          {/* Icono tintado con la paleta del módulo (misma de tarjetas y zona
              de trabajo) para distinguir de un vistazo en qué apartado estás */}
          <div
            className={cn(
              "rounded-lg p-2.5",
              routeKind === "DELIVERY" &&
                "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
              routeKind === "PICKING" &&
                "bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400",
              routeKind === "BOX_DROP" &&
                "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
            )}
          >
            {routeKind === "DELIVERY" ? (
              <Truck className="size-6" />
            ) : routeKind === "PICKING" ? (
              <PackageOpen className="size-6" />
            ) : (
              <Box className="size-6" />
            )}
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {ROUTE_TYPE_COPY[routeKind].tabLabel}
            </h1>
            <p className="text-sm text-muted-foreground">
              {ROUTE_TYPE_COPY[routeKind].subtitle}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => refetch()}>
            <RefreshCw className="size-4" />
            Actualizar
          </Button>
          {canCreateRoutes && (
            <Button className="gap-2" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              {ROUTE_TYPE_COPY[routeKind].newButton}
            </Button>
          )}
        </div>
      </div>

      {/* Zona de trabajo tintada con el color del módulo */}
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-6 rounded-xl border p-4 sm:p-5",
          routeKind === "DELIVERY" &&
            "border-blue-200/60 bg-blue-50/30 dark:border-blue-900/40 dark:bg-blue-950/10",
          routeKind === "PICKING" &&
            "border-sky-200/60 bg-sky-50/30 dark:border-sky-900/40 dark:bg-sky-950/10",
          routeKind === "BOX_DROP" &&
            "border-amber-200/60 bg-amber-50/30 dark:border-amber-900/40 dark:bg-amber-950/10",
        )}
      >
        {/* Stats row (colapsable) */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setStatsOpen((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronDown
              className={cn(
                "size-3.5 transition-transform",
                !statsOpen && "-rotate-90",
              )}
            />
            Métricas
          </button>
          {statsOpen && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Total de rutas"
                value={counts.total}
                icon={Route}
                colorClass="text-foreground"
              />
              <StatCard
                label="Planificadas"
                value={counts.planned}
                icon={Clock}
                colorClass="text-amber-500"
              />
              <StatCard
                label="En curso"
                value={counts.active}
                icon={Truck}
                colorClass="text-blue-500"
              />
              <StatCard
                label="Completadas"
                value={counts.completed}
                icon={CheckCircle2}
                colorClass="text-green-500"
              />
            </div>
          )}
        </div>

        {/* Status tabs — solo el grid de tarjetas scrollea, la página no */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as Tab)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <TabsList className="h-auto flex-wrap gap-1">
            {ALL_TABS.map((tab) => (
              <TabsTrigger key={tab} value={tab} className="gap-1.5 text-sm">
                {TAB_LABELS[tab]}
                <Badge
                  variant="secondary"
                  className="text-xs px-1.5 py-0 h-5 min-w-5"
                >
                  {tabCountMap[tab]}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {ALL_TABS.map((tab) => (
            <TabsContent
              key={tab}
              value={tab}
              className="mt-4 min-h-0 flex-1 overflow-y-auto"
            >
              {filteredRoutes.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                    {routeKind !== "DELIVERY" ? (
                      <PackageOpen className="size-10 opacity-30" />
                    ) : (
                      <Route className="size-10 opacity-30" />
                    )}
                    <p className="text-sm font-medium">
                      No hay rutas{" "}
                      {routeKind === "PICKING"
                        ? "de recolección "
                        : routeKind === "BOX_DROP"
                          ? "de cajas vacías "
                          : "de entrega "}
                      {tab !== "ALL"
                        ? TAB_LABELS[tab].toLowerCase()
                        : "registradas"}
                    </p>
                    {tab === "ALL" && canCreateRoutes && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCreateOpen(true)}
                        className="gap-1.5 mt-1"
                      >
                        <Plus className="size-3.5" />
                        {ROUTE_TYPE_COPY[routeKind].emptyHint}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredRoutes.map((route) => (
                    <RouteCard
                      key={route.id}
                      route={route}
                      driver={driverMap.get(route.driverId)}
                      onDetail={() => setSelectedRoute(route)}
                      onMap={() => setMapRoute(route)}
                      onOptimize={() => handleOptimize(route)}
                      onCancel={() => setRouteToCancel(route)}
                      onPermanentDelete={() =>
                        setRouteToDeletePermanently(route)
                      }
                      isOptimizing={optimizingId === route.id}
                      canCancelRoutes={canCancelRoutes}
                      canDeleteRoutes={canDeleteRoutes}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Dialogs */}
      <CreateRouteDialog
        key={routeKind}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSave={handleCreate}
        drivers={drivers}
        isLoading={isCreatingRoute}
        alreadyRoutedShipmentIds={alreadyRoutedShipmentIds}
        routeType={routeKind}
      />

      <DeliveryRouteDetailDialog
        route={selectedRoute}
        open={!!selectedRoute}
        onClose={() => setSelectedRoute(null)}
        driver={
          selectedRoute ? driverMap.get(selectedRoute.driverId) : undefined
        }
        onDelete={
          canCancelRoutes
            ? (route) => {
                setSelectedRoute(null);
                setRouteToCancel(route);
              }
            : undefined
        }
        onPermanentDelete={
          canDeleteRoutes
            ? (route) => {
                setSelectedRoute(null);
                setRouteToDeletePermanently(route);
              }
            : undefined
        }
        onMap={(route) => {
          setSelectedRoute(null);
          setMapRoute(route);
        }}
      />

      <DeliveryRouteDeleteDialog
        route={routeToCancel}
        open={!!routeToCancel}
        onClose={() => setRouteToCancel(null)}
        onConfirm={handleCancelConfirm}
        isCancelling={cancellingId !== null}
      />

      <DeliveryRoutePermanentDeleteDialog
        route={routeToDeletePermanently}
        open={!!routeToDeletePermanently}
        onClose={() => setRouteToDeletePermanently(null)}
        onConfirm={handleDeletePermanentlyConfirm}
        isDeleting={deletingPermanentlyId !== null}
      />

      <RouteMapDialog
        open={!!mapRoute}
        onClose={() => setMapRoute(null)}
        route={mapRoute}
        onOptimize={() => {
          if (mapRoute) void handleOptimize(mapRoute);
        }}
        isOptimizing={!!mapRoute && optimizingId === mapRoute.id}
      />
    </div>
  );
};
