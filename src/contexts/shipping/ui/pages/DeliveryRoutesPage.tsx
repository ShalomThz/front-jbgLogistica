import { useState } from "react";
import { Plus, Search, Navigation } from "lucide-react";
import {
  Input,
  Badge,
  Button,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/shadcn";
import { DeliveryRouteDetailDialog } from "../components/delivery-route/DeliveryRouteDetailDialog";
import { DeliveryRouteFormDialog } from "../components/delivery-route/DeliveryRouteFormDialog";
import { DeliveryRouteDeleteDialog } from "../components/delivery-route/DeliveryRouteDeleteDialog";
import type { RoutePrimitives, RouteStatus } from "../../domain";

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

const now = new Date().toISOString();

const INITIAL_DATA: RoutePrimitives[] = [
  {
    id: "RUT-001",
    driverId: "DRV-001",
    origin: { latitude: 19.4326, longitude: -99.1332 },
    status: "ACTIVE",
    stops: [
      {
        id: "STP-001",
        stopOrder: 1,
        orderId: "ORD-001",
        address: { address1: "Av. Reforma 123", address2: "", city: "CDMX", province: "CDMX", zip: "06600", country: "MX", reference: "", geolocation: { latitude: 19.43, longitude: -99.14 } },
        isCompleted: true,
      },
      {
        id: "STP-002",
        stopOrder: 2,
        orderId: "ORD-002",
        address: { address1: "Insurgentes Sur 456", address2: "", city: "CDMX", province: "CDMX", zip: "03100", country: "MX", reference: "", geolocation: { latitude: 19.38, longitude: -99.18 } },
        isCompleted: false,
      },
    ],
    finishDate: null,
    mapsMetadata: { distanceKm: 12.5, durationMinutes: 45, polyline: "", metadata: null },
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "RUT-002",
    driverId: "DRV-002",
    origin: { latitude: 19.4100, longitude: -99.1700 },
    status: "PLANNED",
    stops: [
      {
        id: "STP-003",
        stopOrder: 1,
        orderId: "ORD-003",
        address: { address1: "Polanco 789", address2: "", city: "CDMX", province: "CDMX", zip: "11560", country: "MX", reference: "", geolocation: { latitude: 19.43, longitude: -99.19 } },
        isCompleted: false,
      },
    ],
    finishDate: null,
    mapsMetadata: null,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "RUT-003",
    driverId: "DRV-003",
    origin: { latitude: 19.3600, longitude: -99.1600 },
    status: "COMPLETED",
    stops: [
      {
        id: "STP-004",
        stopOrder: 1,
        orderId: "ORD-004",
        address: { address1: "Coyoacán Centro", address2: "", city: "CDMX", province: "CDMX", zip: "04000", country: "MX", reference: "", geolocation: { latitude: 19.35, longitude: -99.16 } },
        isCompleted: true,
      },
      {
        id: "STP-005",
        stopOrder: 2,
        orderId: "ORD-005",
        address: { address1: "Universidad 321", address2: "", city: "CDMX", province: "CDMX", zip: "04510", country: "MX", reference: "", geolocation: { latitude: 19.32, longitude: -99.18 } },
        isCompleted: true,
      },
      {
        id: "STP-006",
        stopOrder: 3,
        orderId: "ORD-006",
        address: { address1: "Del Valle 654", address2: "", city: "CDMX", province: "CDMX", zip: "03100", country: "MX", reference: "", geolocation: { latitude: 19.38, longitude: -99.17 } },
        isCompleted: true,
      },
    ],
    finishDate: new Date(),
    mapsMetadata: { distanceKm: 28.3, durationMinutes: 95, polyline: "", metadata: null },
    createdAt: now,
    updatedAt: now,
  },
];

type RouteFormData = Omit<RoutePrimitives, "id" | "createdAt" | "updatedAt" | "stops" | "mapsMetadata">;

export const DeliveryRoutesPage = () => {
  const [routes, setRoutes] = useState<RoutePrimitives[]>(INITIAL_DATA);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<RoutePrimitives | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editRoute, setEditRoute] = useState<RoutePrimitives | null>(null);
  const [deleteRoute, setDeleteRoute] = useState<RoutePrimitives | null>(null);

  const filtered = routes.filter((r) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      searchQuery === "" ||
      r.id.toLowerCase().includes(query) ||
      r.driverId.toLowerCase().includes(query);
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreate = (data: RouteFormData) => {
    const now = new Date().toISOString();
    const newRoute: RoutePrimitives = {
      ...data,
      id: `RUT-${String(Date.now()).slice(-6)}`,
      stops: [],
      mapsMetadata: null,
      createdAt: now,
      updatedAt: now,
    };
    setRoutes((prev) => [...prev, newRoute]);
    setFormOpen(false);
  };

  const handleUpdate = (data: RouteFormData) => {
    if (!editRoute) return;
    setRoutes((prev) =>
      prev.map((r) =>
        r.id === editRoute.id ? { ...r, ...data, updatedAt: new Date().toISOString() } : r
      )
    );
    setEditRoute(null);
  };

  const handleDelete = () => {
    if (!deleteRoute) return;
    setRoutes((prev) => prev.filter((r) => r.id !== deleteRoute.id));
    setDeleteRoute(null);
  };

  const handleEditFromDetail = (route: RoutePrimitives) => {
    setSelected(null);
    setEditRoute(route);
  };

  const handleDeleteFromDetail = (route: RoutePrimitives) => {
    setSelected(null);
    setDeleteRoute(route);
  };

  const activeRoutes = routes.filter((r) => r.status === "ACTIVE").length;
  const totalStops = routes.reduce((sum, r) => sum + r.stops.length, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rutas de Entrega</h1>
          <p className="text-sm text-muted-foreground">
            {activeRoutes} activas · {totalStops} paradas totales
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="size-4" />
          Crear Ruta
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID o conductor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="PLANNED">Planeada</SelectItem>
            <SelectItem value="ACTIVE">Activa</SelectItem>
            <SelectItem value="COMPLETED">Completada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ruta</TableHead>
              <TableHead className="hidden sm:table-cell">Conductor</TableHead>
              <TableHead className="text-right">Paradas</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No se encontraron rutas.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => {
                const completedStops = r.stops.filter((s) => s.isCompleted).length;
                return (
                  <TableRow key={r.id} className="cursor-pointer" onClick={() => setSelected(r)}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Navigation className="size-4 text-muted-foreground" />
                        <span className="font-medium">{r.id}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">{r.driverId}</TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {completedStops}/{r.stops.length}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[r.status]}>{STATUS_LABELS[r.status]}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <DeliveryRouteDetailDialog
        route={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        onEdit={handleEditFromDetail}
        onDelete={handleDeleteFromDetail}
      />
      <DeliveryRouteFormDialog open={formOpen} onClose={() => setFormOpen(false)} onSave={handleCreate} />
      <DeliveryRouteFormDialog
        open={!!editRoute}
        onClose={() => setEditRoute(null)}
        onSave={handleUpdate}
        route={editRoute}
      />
      <DeliveryRouteDeleteDialog
        route={deleteRoute}
        open={!!deleteRoute}
        onClose={() => setDeleteRoute(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};
