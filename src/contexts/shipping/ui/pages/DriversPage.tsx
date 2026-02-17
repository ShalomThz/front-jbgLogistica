import { useState } from "react";
import { Plus, Search, User } from "lucide-react";
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
} from "@contexts/shared/shadcn";
import { DriverDetailDialog } from "../components/driver/DriverDetailDialog";
import { DriverFormDialog } from "../components/driver/DriverFormDialog";
import { DriverDeleteDialog } from "../components/driver/DriverDeleteDialog";
import type { DriverPrimitives, DriverStatus } from "../../domain/schemas/driver/Driver";

const STATUS_LABELS: Record<DriverStatus, string> = {
  AVAILABLE: "Disponible",
  ON_ROUTE: "En ruta",
  OFF_DUTY: "Fuera de servicio",
};

const STATUS_VARIANT: Record<DriverStatus, "default" | "secondary" | "outline"> = {
  AVAILABLE: "default",
  ON_ROUTE: "secondary",
  OFF_DUTY: "outline",
};

const now = new Date().toISOString();

const INITIAL_DATA: DriverPrimitives[] = [
  { id: "DRV-001", userId: "USR-001", licenseNumber: "LIC-A-12345", status: "AVAILABLE", createdAt: now, updatedAt: now },
  { id: "DRV-002", userId: "USR-002", licenseNumber: "LIC-B-67890", status: "ON_ROUTE", createdAt: now, updatedAt: now },
  { id: "DRV-003", userId: "USR-003", licenseNumber: "LIC-A-11111", status: "AVAILABLE", createdAt: now, updatedAt: now },
  { id: "DRV-004", userId: "USR-004", licenseNumber: "LIC-B-22222", status: "OFF_DUTY", createdAt: now, updatedAt: now },
  { id: "DRV-005", userId: "USR-005", licenseNumber: "LIC-A-33333", status: "ON_ROUTE", createdAt: now, updatedAt: now },
];

export const DriversPage = () => {
  const [drivers, setDrivers] = useState<DriverPrimitives[]>(INITIAL_DATA);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<DriverPrimitives | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editDriver, setEditDriver] = useState<DriverPrimitives | null>(null);
  const [deleteDriver, setDeleteDriver] = useState<DriverPrimitives | null>(null);

  const filtered = drivers.filter((d) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      searchQuery === "" ||
      d.id.toLowerCase().includes(query) ||
      d.userId.toLowerCase().includes(query) ||
      d.licenseNumber.toLowerCase().includes(query);
    const matchesStatus = statusFilter === "all" || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreate = (data: Omit<DriverPrimitives, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    const newDriver: DriverPrimitives = {
      ...data,
      id: `DRV-${String(Date.now()).slice(-6)}`,
      createdAt: now,
      updatedAt: now,
    };
    setDrivers((prev) => [...prev, newDriver]);
    setFormOpen(false);
  };

  const handleUpdate = (data: Omit<DriverPrimitives, "id" | "createdAt" | "updatedAt">) => {
    if (!editDriver) return;
    setDrivers((prev) =>
      prev.map((d) =>
        d.id === editDriver.id ? { ...d, ...data, updatedAt: new Date().toISOString() } : d
      )
    );
    setEditDriver(null);
  };

  const handleDelete = () => {
    if (!deleteDriver) return;
    setDrivers((prev) => prev.filter((d) => d.id !== deleteDriver.id));
    setDeleteDriver(null);
  };

  const handleEditFromDetail = (driver: DriverPrimitives) => {
    setSelected(null);
    setEditDriver(driver);
  };

  const handleDeleteFromDetail = (driver: DriverPrimitives) => {
    setSelected(null);
    setDeleteDriver(driver);
  };

  const available = drivers.filter((d) => d.status === "AVAILABLE").length;
  const onRoute = drivers.filter((d) => d.status === "ON_ROUTE").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Conductores</h1>
          <p className="text-sm text-muted-foreground">
            {available} disponibles · {onRoute} en ruta
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="size-4" />
          Crear Conductor
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID, usuario o licencia..."
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
            <SelectItem value="AVAILABLE">Disponible</SelectItem>
            <SelectItem value="ON_ROUTE">En ruta</SelectItem>
            <SelectItem value="OFF_DUTY">Fuera de servicio</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Conductor</TableHead>
              <TableHead className="hidden sm:table-cell">Usuario</TableHead>
              <TableHead className="hidden md:table-cell">Licencia</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No se encontraron conductores.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((d) => (
                <TableRow key={d.id} className="cursor-pointer" onClick={() => setSelected(d)}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="size-4 text-muted-foreground" />
                      <span className="font-medium">{d.id}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm">{d.userId}</TableCell>
                  <TableCell className="hidden md:table-cell font-mono text-sm">{d.licenseNumber}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[d.status]}>{STATUS_LABELS[d.status]}</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DriverDetailDialog
        driver={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        onEdit={handleEditFromDetail}
        onDelete={handleDeleteFromDetail}
      />
      <DriverFormDialog open={formOpen} onClose={() => setFormOpen(false)} onSave={handleCreate} />
      <DriverFormDialog
        open={!!editDriver}
        onClose={() => setEditDriver(null)}
        onSave={handleUpdate}
        driver={editDriver}
      />
      <DriverDeleteDialog
        driver={deleteDriver}
        open={!!deleteDriver}
        onClose={() => setDeleteDriver(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};
