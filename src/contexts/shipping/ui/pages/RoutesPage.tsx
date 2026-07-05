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
  CheckCircle2,
  Clock,
  MapPin,
  Navigation,
  PackageOpen,
  Plus,
  RefreshCw,
  Route,
  Truck,
  User,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { parseApiError } from "../../../shared/infrastructure/http";
import type { CreateRouteRequest } from "../../application/route/CreateRouteRequest";
import type { RouteResponsePrimitives } from "../../application/route/RouteResponse";
import type { DriverListViewPrimitives } from "../../domain/schemas/driver/DriverListView";
import type { RouteStatus, RouteType } from "../../domain/schemas/route/Route";
import { useDrivers } from "../../infrastructure/hooks/drivers/useDrivers";
import { useRoutes } from "../../infrastructure/hooks/routes/useRoutes";
import { CreateRouteDialog } from "../components/delivery-route/CreateRouteDialog";
import { DeliveryRouteDeleteDialog } from "../components/delivery-route/DeliveryRouteDeleteDialog";
import { DeliveryRouteDetailDialog } from "../components/delivery-route/DeliveryRouteDetailDialog";
import { RouteMapDialog } from "../components/route/RouteMapDialog";

const STATUS_LABELS: Record<RouteStatus, string> = {
  PLANNED: "Planificada",
  ACTIVE: "Activa",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
};

const STATUS_BADGE_VARIANT: Record<
  RouteStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  PLANNED: "outline",
  ACTIVE: "secondary",
  COMPLETED: "default",
  CANCELLED: "destructive",
};

const ALL_TABS = ["ALL", "PLANNED", "ACTIVE", "COMPLETED", "CANCELLED"] as const;
type Tab = (typeof ALL_TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
  ALL: "Todas",
  PLANNED: "Planificadas",
  ACTIVE: "Activas",
  COMPLETED: "Completadas",
  CANCELLED: "Canceladas",
};

/** Copy that differs between delivery and picking (recolección) modules */
const ROUTE_TYPE_COPY: Record<
  RouteType,
  {
    tabLabel: string;
    subtitle: string;
    newButton: string;
    stopsDoneLabel: string;
    emptyHint: string;
  }
> = {
  DELIVERY: {
    tabLabel: "Rutas de entrega",
    subtitle:
      "Planifica rutas, asigna conductores y monitorea el progreso de cada entrega.",
    newButton: "Nueva ruta de entrega",
    stopsDoneLabel: "entregadas",
    emptyHint: "Crear primera ruta de entrega",
  },
  PICKING: {
    tabLabel: "Rutas para recolección",
    subtitle:
      'Crea rutas para recolectar a domicilio los paquetes de órdenes "aplica recolección a domicilio" (flota JBG).',
    newButton: "Nueva ruta de recolección",
    stopsDoneLabel: "recolectadas",
    emptyHint: "Crear primera ruta de recolección",
  },
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
  isOptimizing: boolean;
}

function RouteCard({
  route,
  driver,
  onDetail,
  onMap,
  onOptimize,
  onCancel,
  isOptimizing,
}: RouteCardProps) {
  const delivered = route.stops.filter((s) => s.status === "DELIVERED").length;
  const total = route.stops.length;
  const failed = route.stops.filter((s) => s.status === "FAILED" || s.status === "RETURNED").length;
  const progress = total > 0 ? Math.round((delivered / total) * 100) : 0;
  const canOptimize = route.status === "PLANNED" && total > 0;
  const canCancel =
    route.status !== "COMPLETED" && route.status !== "CANCELLED";
  const shortId = route.id.slice(0, 8).toUpperCase();
  const isPicking = route.type === "PICKING";

  return (
    <Card className="hover:shadow-md transition-shadow flex flex-col">
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
            <Badge variant={STATUS_BADGE_VARIANT[route.status]}>
              {STATUS_LABELS[route.status]}
            </Badge>
            <Badge
              variant="outline"
              className={
                isPicking
                  ? "gap-1 border-amber-300 text-amber-700"
                  : "gap-1 border-sky-300 text-sky-700"
              }
            >
              {isPicking ? (
                <PackageOpen className="size-3" />
              ) : (
                <Truck className="size-3" />
              )}
              {isPicking ? "Recolección" : "Entrega"}
            </Badge>
          </div>
        </div>

        {/* Progress */}
        {total > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {delivered}/{total}{" "}
                {ROUTE_TYPE_COPY[route.type].stopsDoneLabel}
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
        </div>
      </CardContent>
    </Card>
  );
}

export const RoutesPage = () => {
  const [routeKind, setRouteKind] = useState<RouteType>("DELIVERY");
  const [activeTab, setActiveTab] = useState<Tab>("ALL");
  const [selectedRoute, setSelectedRoute] =
    useState<RouteResponsePrimitives | null>(null);
  const [routeToCancel, setRouteToCancel] =
    useState<RouteResponsePrimitives | null>(null);
  const [mapRoute, setMapRoute] = useState<RouteResponsePrimitives | null>(
    null,
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [optimizingId, setOptimizingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const {
    routes,
    isLoading,
    refetch,
    createRoute,
    isCreatingRoute,
    optimizeRoute,
    cancelRoute,
  } = useRoutes({ filters: [], page: 1, limit: LIMIT });

  // Fetch all drivers to resolve names from driverId
  const { drivers } = useDrivers({ filters: [] });
  const driverMap = useMemo(
    () => new Map(drivers.map((d) => [d.id, d])),
    [drivers],
  );

  // Split the two route modules: entrega vs recolección a domicilio
  const typedRoutes = useMemo(
    () => routes.filter((r) => r.type === routeKind),
    [routes, routeKind],
  );

  const typeCounts = useMemo(
    () => ({
      DELIVERY: routes.filter((r) => r.type === "DELIVERY").length,
      PICKING: routes.filter((r) => r.type === "PICKING").length,
    }),
    [routes],
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
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Rutas</h1>
          <p className="text-sm text-muted-foreground">
            {ROUTE_TYPE_COPY[routeKind].subtitle}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => refetch()}
          >
            <RefreshCw className="size-4" />
            Actualizar
          </Button>
          <Button className="gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            {ROUTE_TYPE_COPY[routeKind].newButton}
          </Button>
        </div>
      </div>

      {/* Module switch: entrega vs recolección a domicilio */}
      <Tabs
        value={routeKind}
        onValueChange={(v) => {
          setRouteKind(v as RouteType);
          setActiveTab("ALL");
        }}
      >
        <TabsList className="h-auto gap-1">
          <TabsTrigger value="DELIVERY" className="gap-2 px-4 py-2 text-sm">
            <Truck className="size-4" />
            {ROUTE_TYPE_COPY.DELIVERY.tabLabel}
            <Badge
              variant="secondary"
              className="text-xs px-1.5 py-0 h-5 min-w-5"
            >
              {typeCounts.DELIVERY}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="PICKING" className="gap-2 px-4 py-2 text-sm">
            <PackageOpen className="size-4" />
            {ROUTE_TYPE_COPY.PICKING.tabLabel}
            <Badge
              variant="secondary"
              className="text-xs px-1.5 py-0 h-5 min-w-5"
            >
              {typeCounts.PICKING}
            </Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Stats row */}
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

      {/* Status tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)}>
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
          <TabsContent key={tab} value={tab} className="mt-4">
            {filteredRoutes.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                  {routeKind === "PICKING" ? (
                    <PackageOpen className="size-10 opacity-30" />
                  ) : (
                    <Route className="size-10 opacity-30" />
                  )}
                  <p className="text-sm font-medium">
                    No hay rutas{" "}
                    {routeKind === "PICKING" ? "de recolección " : "de entrega "}
                    {tab !== "ALL"
                      ? TAB_LABELS[tab].toLowerCase()
                      : "registradas"}
                  </p>
                  {tab === "ALL" && (
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
                    isOptimizing={optimizingId === route.id}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

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
        onDelete={(route) => {
          setSelectedRoute(null);
          setRouteToCancel(route);
        }}
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
