import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Progress,
  Separator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@contexts/shared/shadcn";
import { PageLoader } from "@contexts/shared/ui/components/PageLoader";
import {
  Map,
  MapPinned,
  Navigation,
  Package,
  RefreshCw,
  Route,
  Search,
  Sparkles,
  Truck
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useOrders } from "../../../sales/infrastructure/hooks/orders/userOrders";
import { parseApiError } from "../../../shared/infrastructure/http";
import { formatDate } from "../../../shared/infrastructure/services/format-date,";
import type { RouteStatus } from "../../domain/schemas/route/Route";
import type { ShipmentPrimitives } from "../../domain/schemas/shipment/Shipment";
import { useDrivers } from "../../infrastructure/hooks/drivers/useDrivers";
import { useRoutes } from "../../infrastructure/hooks/routes/useRoutes";
import { RouteMapDialog } from "../components/route/RouteMapDialog";

const STATUS_LABELS: Record<RouteStatus, string> = {
  PLANNED: "Planeada",
  ACTIVE: "Activa",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
};

const STATUS_VARIANT: Record<RouteStatus, "default" | "secondary" | "outline"> = {
  PLANNED: "outline",
  ACTIVE: "secondary",
  COMPLETED: "default",
  CANCELLED: "outline",
};

function mapDriverStatus(status: string) {
  switch (status) {
    case "AVAILABLE":
      return "Disponible";
    case "ON_ROUTE":
      return "En ruta";
    case "OFFLINE":
      return "Desconectado";
    default:
      return status;
  }
}

const LIMIT = 20;

function StatCard({
  title,
  value,
  detail,
  icon: Icon,
}: {
  title: string;
  value: string;
  detail: string;
  icon: typeof Route;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold">{value}</p>
          <p className="text-xs text-muted-foreground">{detail}</p>
        </div>
        <div className="rounded-full bg-primary/10 p-3 text-primary">
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}

const getTrackingLabel = (shipment: ShipmentPrimitives) =>
  shipment.label?.trackingNumber ?? shipment.orderId;

export const DeliveryRoutesPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | RouteStatus>("ALL");
  const [shipmentSearch, setShipmentSearch] = useState("");
  const [originLat, setOriginLat] = useState("19.4326");
  const [originLng, setOriginLng] = useState("-99.1332");
  const [originPlaceId, setOriginPlaceId] = useState("");
  const [selectedShipmentIds, setSelectedShipmentIds] = useState<string[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [mapRouteId, setMapRouteId] = useState<string | null>(null);

  const {
    routes,
    pagination,
    totalPages,
    isLoading,
    refetch,
    createRoute,
    isCreatingRoute,
    optimizeRoute,
    isOptimizingRoute,
    cancelRoute,
    isCancellingRoute,
  } = useRoutes({ page, limit: LIMIT, filters: [] });

  const { drivers } = useDrivers({
    page: 1,
    limit: 100,
    filters: [],
  });

  const { orders } = useOrders({
    page: 1,
    limit: 100,
    filters: [{ field: "shipment.status", filterOperator: "=", value: "FULFILLED" }],
  });

  const fulfilledOrders = useMemo(() => orders.filter((order): order is typeof order & { shipment: ShipmentPrimitives } => order.shipment !== null && order.shipment.status === "FULFILLED"), [orders]);

  const availableDrivers = useMemo(
    () => drivers.filter((driver) => driver.status === "AVAILABLE"),
    [drivers],
  );

  const filteredRoutes = useMemo(() => {
    const query = search.trim().toLowerCase();

    return routes.filter((route) => {
      const matchesSearch =
        !query ||
        route.id.toLowerCase().includes(query) ||
        route.driverId.toLowerCase().includes(query) ||
        route.stops.some((stop) => stop.shipmentId.toLowerCase().includes(query));

      const matchesStatus =
        statusFilter === "ALL" || route.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [routes, search, statusFilter]);

  const selectableShipments = useMemo(() => {
    const query = shipmentSearch.trim().toLowerCase();

    return fulfilledOrders.filter((order) => {
      if (!query) return true;

      return (
        order.shipment.id.toLowerCase().includes(query) ||
        order.shipment.orderId.toLowerCase().includes(query) ||
        getTrackingLabel(order.shipment).toLowerCase().includes(query)
      );
    });
  }, [fulfilledOrders, shipmentSearch]);

  const selectedShipments = useMemo(
    () =>
      selectableShipments.filter((shipment) =>
        selectedShipmentIds.includes(shipment.id),
      ),
    [selectableShipments, selectedShipmentIds],
  );

  const selectedRoute =
    filteredRoutes.find((route) => route.id === selectedRouteId) ??
    routes.find((route) => route.id === selectedRouteId) ??
    filteredRoutes[0] ??
    null;

  const mapRoute =
    routes.find((route) => route.id === mapRouteId) ?? null;

  const activeRoutes = routes.filter((route) => route.status === "ACTIVE").length;
  const plannedRoutes = routes.filter((route) => route.status === "PLANNED").length;
  const completedStops = routes.reduce(
    (total, route) =>
      total +
      route.stops.filter((stop) => stop.status === "DELIVERED").length,
    0,
  );

  const toggleShipment = (shipmentId: string) => {
    setSelectedShipmentIds((current) =>
      current.includes(shipmentId)
        ? current.filter((id) => id !== shipmentId)
        : [...current, shipmentId],
    );
  };

  const handleCreateRoute = async () => {
    if (selectedShipmentIds.length === 0) {
      toast.error("Selecciona al menos un envío para crear la ruta.");
      return;
    }

    if (!selectedDriverId) {
      toast.error("Selecciona un conductor para crear la ruta.");
      return;
    }

    try {
      const createdRoute = await createRoute({
        origin: {
          latitude: Number(originLat),
          longitude: Number(originLng),
          placeId: originPlaceId ?? null,
        },
        driverId: selectedDriverId,
        shipmentIds: selectedShipmentIds,
      });

      toast.success("Ruta creada correctamente.");
      setSelectedRouteId(createdRoute.id);
      setSelectedShipmentIds([]);
      setSelectedDriverId(null);
      setShipmentSearch("");
    } catch (error) {
      toast.error(parseApiError(error));
    }
  };

  const handleOptimizeRoute = async (routeId: string) => {
    try {
      await optimizeRoute(routeId);
      toast.success("Ruta optimizada.");
    } catch (error) {
      toast.error(parseApiError(error));
    }
  };

  const handleCancelRoute = async (routeId: string) => {
    try {
      await cancelRoute(routeId);
      toast.success("Ruta cancelada.");
    } catch (error) {
      toast.error(parseApiError(error));
    }
  };

  if (isLoading) {
    return <PageLoader text="Cargando centro de rutas..." />;
  }

  const findDriverById = (driverId: string) => drivers.find((driver) => driver.id === driverId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Centro de rutas
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Planea rutas con paquetes listos para salir, asigna conductores
            disponibles y supervisa la ejecución sin saltar entre pantallas.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          className="gap-2"
        >
          <RefreshCw className="size-4" />
          Actualizar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Rutas activas"
          value={String(activeRoutes)}
          detail={`${plannedRoutes} esperando salida`}
          icon={Navigation}
        />
        <StatCard
          title="Paquetes elegibles"
          value={String(fulfilledOrders.length)}
          detail="Envios listos para planear"
          icon={Package}
        />
        <StatCard
          title="Conductores listos"
          value={String(availableDrivers.length)}
          detail={`${completedStops} entregas completadas en el lote visible`}
          icon={Truck}
        />
      </div>

      <Tabs defaultValue="planner" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:w-90">
          <TabsTrigger value="planner">Planificador</TabsTrigger>
          <TabsTrigger value="routes">Rutas activas</TabsTrigger>
        </TabsList>

        <TabsContent value="planner" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
            <Card className="border-primary/10">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="size-5 text-primary" />
                      Construir nueva ruta
                    </CardTitle>
                    <CardDescription>
                      Primero elegimos los envíos, después fijamos origen y
                      conductor para dejar la ruta lista para salir.
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">
                    {selectedShipmentIds.length} paquetes elegidos
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Latitud origen</p>
                    <Input
                      value={originLat}
                      onChange={(event) => setOriginLat(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Longitud origen</p>
                    <Input
                      value={originLng}
                      onChange={(event) => setOriginLng(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Place ID opcional</p>
                    <Input
                      value={originPlaceId}
                      onChange={(event) => setOriginPlaceId(event.target.value)}
                      placeholder="Google Maps Place ID"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">Conductor sugerido</p>
                      <p className="text-xs text-muted-foreground">
                        Puedes dejar la ruta creada sin asignar y decidirlo
                        después.
                      </p>
                    </div>
                    {selectedDriverId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedDriverId(null)}
                      >
                        Limpiar
                      </Button>
                    )}
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    {availableDrivers.slice(0, 6).map((driver) => (
                      <button
                        key={driver.id}
                        type="button"
                        onClick={() =>
                          setSelectedDriverId((current) =>
                            current === driver.id ? null : driver.id,
                          )
                        }
                        className={`rounded-xl border p-3 text-left transition ${selectedDriverId === driver.id
                          ? "border-primary bg-primary/5"
                          : "hover:border-primary/40"
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{driver.user.name}</span>
                          <Badge variant="outline">{mapDriverStatus(driver.status)}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Licencia {driver.licenseNumber}
                        </p>
                      </button>
                    ))}
                    {availableDrivers.length === 0 && (
                      <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                        No hay conductores disponibles en este momento.
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">Paradas disponibles</p>
                      <p className="text-xs text-muted-foreground">
                        Selecciona únicamente envíos en estado fulfilled.
                      </p>
                    </div>
                    <div className="relative w-full max-w-sm">
                      <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={shipmentSearch}
                        onChange={(event) =>
                          setShipmentSearch(event.target.value)
                        }
                        placeholder="Buscar por envío, orden o tracking"
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-2">
                    {selectableShipments.map((order) => {
                      const shipment = order.shipment;
                      const selected = selectedShipmentIds.includes(shipment.id);
                      return (
                        <button
                          key={shipment.id}
                          type="button"
                          onClick={() => toggleShipment(shipment.id)}
                          className={`rounded-2xl border p-4 text-left transition ${selected
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "hover:border-primary/40"
                            }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium">Num Factura JBG {order.references.orderNumber}</p>
                              {order.references.partnerOrderNumber && (
                                <p className="text-sm text-muted-foreground">
                                  Num factura agente: {order.references.partnerOrderNumber}
                                </p>
                              )}

                            </div>
                            <Badge variant={selected ? "default" : "outline"}>
                              {selected ? "Incluido" : "Disponible"}
                            </Badge>
                          </div>
                          <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                            <span>
                              Tracking: {getTrackingLabel(shipment)}
                            </span>
                            <span>
                              Peso: {shipment.parcel.weight.value}{" "}
                              {shipment.parcel.weight.unit}
                            </span>
                            <span>
                              Caja: {shipment.parcel.dimensions.length} x{" "}
                              {shipment.parcel.dimensions.width} x{" "}
                              {shipment.parcel.dimensions.height} {" "} {shipment.parcel.dimensions.unit}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                    {selectableShipments.length === 0 && (
                      <div className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
                        No encontramos envíos fulfilled con ese filtro.
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumen de despacho</CardTitle>
                <CardDescription>
                  Antes de crear, revisa rápidamente el lote que va a salir.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl bg-muted/40 p-4">
                  <p className="text-sm text-muted-foreground">
                    Origen
                  </p>
                  <p className="font-medium">
                    {originLat}, {originLng}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {originPlaceId || "Sin Place ID configurado"}
                  </p>
                </div>

                <div className="rounded-2xl bg-muted/40 p-4">
                  <p className="text-sm text-muted-foreground">
                    Conductor
                  </p>
                  <p className="font-medium">
                    {selectedDriverId ?? "Se asignará más tarde"}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Paradas seleccionadas ({selectedShipmentIds.length})
                  </p>
                  <div className="space-y-2">
                    {selectedShipments.map((order) => {
                      const shipment = order.shipment;

                      return (
                        <div
                          key={shipment.id}
                          className="flex items-center justify-between rounded-xl border p-3"
                        >
                          <div>
                            <p className="font-medium">{shipment.id}</p>
                            <p className="text-xs text-muted-foreground">
                              Orden {shipment.orderId}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {getTrackingLabel(shipment)}
                          </Badge>
                        </div>
                      )
                    })}
                    {selectedShipments.length === 0 && (
                      <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                        Todavía no has elegido paquetes.
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  onClick={handleCreateRoute}
                  disabled={isCreatingRoute}
                  className="w-full gap-2"
                >
                  <Sparkles className="size-4" />
                  Crear ruta
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="routes" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
            <Card>
              <CardHeader className="space-y-3">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <CardTitle>Tablero de rutas</CardTitle>
                    <CardDescription>
                      Busca por ruta, conductor o shipment asignado.
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative min-w-55">
                      <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Buscar ruta"
                        className="pl-9"
                      />
                    </div>
                    <div className="flex gap-2">
                      {(["ALL", "PLANNED", "ACTIVE", "COMPLETED"] as const).map(
                        (value) => (
                          <Button
                            key={value}
                            variant={statusFilter === value ? "default" : "outline"}
                            size="sm"
                            onClick={() => setStatusFilter(value)}
                          >
                            {value === "ALL" ? "Todas" : STATUS_LABELS[value]}
                          </Button>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ruta</TableHead>
                        <TableHead>Conductor</TableHead>
                        <TableHead>Paradas</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRoutes.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="h-24 text-center text-muted-foreground"
                          >
                            No hay rutas para ese filtro.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredRoutes.map((route) => {
                          const deliveredStops = route.stops.filter(
                            (stop) => stop.status === "DELIVERED",
                          ).length;

                          return (
                            <TableRow
                              key={route.id}
                              className="cursor-pointer"
                              onClick={() => setSelectedRouteId(route.id)}
                            >
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Navigation className="size-4 text-muted-foreground" />
                                  <div>
                                    <p className="font-medium">{formatDate(route.createdAt)}</p>
                                    <p className="text-sm text-muted-foreground">{route.id.substring(0, 8)}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {route.mapsMetadata
                                        ? `${route.mapsMetadata.distanceKm.toFixed(1)} km`
                                        : "Sin optimizar"}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{findDriverById(route.driverId)?.user.name || "Conductor no encontrado"}</TableCell>
                              <TableCell>
                                {deliveredStops}/{route.stops.length}
                              </TableCell>
                              <TableCell>
                                <Badge variant={STATUS_VARIANT[route.status]}>
                                  {STATUS_LABELS[route.status]}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setMapRouteId(route.id);
                                    }}
                                    title="Ver mapa"
                                  >
                                    <Map className="size-4" />
                                    <span className="sr-only">Ver mapa</span>
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      void handleOptimizeRoute(route.id);
                                    }}
                                    disabled={
                                      route.status !== "PLANNED" ||
                                      isOptimizingRoute
                                    }
                                  >
                                    Optimizar
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      void handleCancelRoute(route.id);
                                    }}
                                    disabled={
                                      route.status === "COMPLETED" ||
                                      route.status === "CANCELLED" ||
                                      isCancellingRoute
                                    }
                                  >
                                    Cancelar
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>

                {pagination && pagination.total > LIMIT && (
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Página {page} de {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage((current) => current - 1)}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!pagination.hasMore}
                        onClick={() => setPage((current) => current + 1)}
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ruta en foco</CardTitle>
                <CardDescription>
                  Visualiza el progreso y ejecuta acciones rápidas sobre la ruta
                  seleccionada.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!selectedRoute ? (
                  <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                    Selecciona una ruta para ver sus paradas, conductor y
                    opciones de despacho.
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold">{selectedRoute.id.substring(0, 8)}</p>
                        <p className="text-sm text-muted-foreground">
                          Creada el{" "}
                          {formatDate(selectedRoute.createdAt)}
                        </p>
                      </div>
                      <Badge variant={STATUS_VARIANT[selectedRoute.status]}>
                        {STATUS_LABELS[selectedRoute.status]}
                      </Badge>
                    </div>

                    <div className="rounded-2xl bg-muted/40 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Progreso de entregas
                          </p>
                          <p className="font-medium">
                            {
                              selectedRoute.stops.filter(
                                (stop) => stop.status === "DELIVERED",
                              ).length
                            }{" "}
                            de {selectedRoute.stops.length}
                          </p>
                        </div>
                        <MapPinned className="size-5 text-primary" />
                      </div>
                      <Progress
                        className="mt-3"
                        value={
                          selectedRoute.stops.length === 0
                            ? 0
                            : (selectedRoute.stops.filter(
                              (stop) => stop.status === "DELIVERED",
                            ).length /
                              selectedRoute.stops.length) *
                            100
                        }
                      />
                    </div>

                    {selectedRoute.status === "PLANNED" && (
                      <div className="space-y-3 rounded-2xl border p-4">
                        <div>
                          <p className="font-medium">Conductor asignado</p>
                        </div>
                        <div className="grid gap-2">
                          <button
                            type="button"
                            className="rounded-xl border p-3 text-left transition border-primary bg-primary/5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{findDriverById(selectedRoute.driverId)?.user.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {findDriverById(selectedRoute.driverId)?.licenseNumber}
                              </span>
                            </div>
                          </button>
                        </div>

                      </div>
                    )}

                    <div className="space-y-2">
                      <p className="font-medium">Paradas</p>
                      {selectedRoute.stops.map((stop) => (
                        <div
                          key={stop.id}
                          className="rounded-2xl border p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium">
                                #{stop.stopOrder}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {stop.address.address1} {stop.address.address2}, {stop.address.zip}, {stop.address.city}, {stop.address.province}, {stop.address.country}

                              </p>
                            </div>
                            <Badge
                              variant={
                                stop.status === "DELIVERED"
                                  ? "default"
                                  : stop.status === "RETURNED"
                                    ? "outline"
                                    : "secondary"
                              }
                            >
                              {stop.status}
                            </Badge>
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Intentos registrados: {stop.attempts.length}
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <RouteMapDialog
        open={!!mapRouteId}
        onClose={() => setMapRouteId(null)}
        route={mapRoute}
      />
    </div>
  );
};
