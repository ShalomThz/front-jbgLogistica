import { useState } from "react";
import { Plus, RefreshCw, User } from "lucide-react";
import {
  Badge,
  Button,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@contexts/shared/shadcn";
import { DriverDetailDialog } from "../components/driver/DriverDetailDialog";
import { DriverFormDialog } from "../components/driver/DriverFormDialog";
import { DriverDeleteDialog } from "../components/driver/DriverDeleteDialog";
import { DriverFilters } from "../components/driver/DriverFilters";
import { useDriverFilters } from "../hooks/useDriverFilters";
import type {
  DriverPrimitives,
  DriverStatus,
} from "../../domain/schemas/driver/Driver";

const STATUS_LABELS: Record<DriverStatus, string> = {
  AVAILABLE: "Disponible",
  ON_ROUTE: "En ruta",
  OFF_DUTY: "Fuera de servicio",
};

const STATUS_VARIANT: Record<
  DriverStatus,
  "default" | "secondary" | "outline"
> = {
  AVAILABLE: "default",
  ON_ROUTE: "secondary",
  OFF_DUTY: "outline",
};

const now = new Date().toISOString();

const INITIAL_DATA: DriverPrimitives[] = [
  {
    id: "DRV-001",
    userId: "USR-001",
    licenseNumber: "LIC-A-12345",
    status: "AVAILABLE",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "DRV-002",
    userId: "USR-002",
    licenseNumber: "LIC-B-67890",
    status: "ON_ROUTE",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "DRV-003",
    userId: "USR-003",
    licenseNumber: "LIC-A-11111",
    status: "AVAILABLE",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "DRV-004",
    userId: "USR-004",
    licenseNumber: "LIC-B-22222",
    status: "OFF_DUTY",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "DRV-005",
    userId: "USR-005",
    licenseNumber: "LIC-A-33333",
    status: "ON_ROUTE",
    createdAt: now,
    updatedAt: now,
  },
];

export const DriversPage = () => {
  const [drivers, setDrivers] = useState<DriverPrimitives[]>(INITIAL_DATA);
  const { filters, setFilter, resetFilters, filtered } =
    useDriverFilters(drivers);

  const [selected, setSelected] = useState<DriverPrimitives | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editDriver, setEditDriver] = useState<DriverPrimitives | null>(null);
  const [deleteDriver, setDeleteDriver] = useState<DriverPrimitives | null>(
    null,
  );

  const handleCreate = (
    data: Omit<DriverPrimitives, "id" | "createdAt" | "updatedAt">,
  ) => {
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

  const handleUpdate = (
    data: Omit<DriverPrimitives, "id" | "createdAt" | "updatedAt">,
  ) => {
    if (!editDriver) return;
    setDrivers((prev) =>
      prev.map((d) =>
        d.id === editDriver.id
          ? { ...d, ...data, updatedAt: new Date().toISOString() }
          : d,
      ),
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
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => resetFilters()}>
            <RefreshCw className="size-4" />
          </Button>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="size-4" />
            Crear Conductor
          </Button>
        </div>
      </div>

      <DriverFilters
        filters={filters}
        setFilter={setFilter}
        onReset={resetFilters}
      />

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
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-muted-foreground"
                >
                  No se encontraron conductores.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((d) => (
                <TableRow
                  key={d.id}
                  className="cursor-pointer"
                  onClick={() => setSelected(d)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="size-4 text-muted-foreground" />
                      <span className="font-medium">{d.id}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm">
                    {d.userId}
                  </TableCell>
                  <TableCell className="hidden md:table-cell font-mono text-sm">
                    {d.licenseNumber}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[d.status]}>
                      {STATUS_LABELS[d.status]}
                    </Badge>
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
      <DriverFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleCreate}
      />
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
