import { useUsers } from "@contexts/iam/infrastructure/hooks/users/useUsers";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@contexts/shared/shadcn";
import { PageLoader } from "@contexts/shared/ui/components/PageLoader";
import {
  BadgeCheck,
  CarFront,
  ClipboardList,
  Plus,
  RefreshCw,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { parseApiError } from "../../../shared/infrastructure/http";
import { formatDate } from "../../../shared/infrastructure/services/format-date,";
import type { EditDriverRequest } from "../../application/driver/EditDriverRequest";
import type { DriverStatus } from "../../domain/schemas/driver/Driver";
import type { DriverListViewPrimitives, } from "../../domain/schemas/driver/DriverListView";
import { useDrivers } from "../../infrastructure/hooks/drivers/useDrivers";
import { CreateDriverUserDialog } from "../components/driver/CreateDriverUserDialog";
import { DriverDetailDialog } from "../components/driver/DriverDetailDialog";
import { EditDriverDialog } from "../components/driver/EditDriverDialog";

const LIMIT = 20;

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

function DriverStat({
  title,
  value,
  detail,
  icon: Icon,
}: {
  title: string;
  value: string;
  detail: string;
  icon: typeof UserRound;
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


export const DriversPage = () => {
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<DriverListViewPrimitives | null>(null);
  const [editDriver, setEditDriver] = useState<DriverListViewPrimitives | null>(null);

  const {
    drivers,
    pagination,
    totalPages,
    isLoading,
    refetch,
    createDriver,
    isCreatingDriver,
    updateDriver,
    isUpdating,
  } = useDrivers({ filters: [], page, limit: LIMIT });
  const { createUser, isCreating } = useUsers({ page: 1, limit: 10 });

  const availableCount = drivers.filter((d) => d.status === "AVAILABLE").length;
  const onRouteCount = drivers.filter((d) => d.status === "ON_ROUTE").length;
  const offDutyCount = drivers.filter((d) => d.status === "OFF_DUTY").length;

  const handleCreate = async ({
    user,
    licenseNumber,
  }: {
    user: Parameters<typeof createUser>[0];
    licenseNumber: string;
  }) => {
    try {
      const userId = await createUser(user);
      await createDriver({ userId, licenseNumber: licenseNumber.trim() });
      toast.success("Conductor creado.");
      setFormOpen(false);
      setPage(1);
    } catch (error) {
      toast.error(parseApiError(error));
    }
  };

  const handleUpdate = async (data: EditDriverRequest) => {
    if (!editDriver) return;
    try {
      await updateDriver(editDriver.id, data);
      toast.success("Conductor actualizado.");
      setEditDriver(null);
    } catch (err) {
      toast.error(parseApiError(err));
    }
  };

  if (isLoading) {
    return <PageLoader text="Cargando conductores..." />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Conductores</h1>
          <p className="text-sm text-muted-foreground">
            Gestión de conductores y sus perfiles operativos.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => refetch()}>
            <RefreshCw className="size-4" />
            Actualizar
          </Button>
          <Button
            className="gap-2"
            onClick={() => setFormOpen(true)}
            disabled={isCreating || isCreatingDriver}
          >
            <Plus className="size-4" />
            Nuevo conductor
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <DriverStat
          title="Disponibles"
          value={String(availableCount)}
          detail="Listos para asignación"
          icon={BadgeCheck}
        />
        <DriverStat
          title="En ruta"
          value={String(onRouteCount)}
          detail="Con entrega activa"
          icon={CarFront}
        />
        <DriverStat
          title="Fuera de servicio"
          value={String(offDutyCount)}
          detail="No disponibles por ahora"
          icon={ClipboardList}
        />
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registro de conductores</CardTitle>
          <CardDescription>
            Haz clic en una fila para ver los detalles o editar el perfil.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Conductor</TableHead>
                  <TableHead>Licencia</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Registro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drivers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No hay conductores registrados.
                    </TableCell>
                  </TableRow>
                ) : (
                  drivers.map((driver) => (
                    <TableRow
                      key={driver.id}
                      className="cursor-pointer"
                      onClick={() => setSelected(driver)}
                    >
                      <TableCell>
                        <div className="font-medium">{driver.user.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {driver.user.email}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {driver.licenseNumber}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[driver.status]}>
                          {STATUS_LABELS[driver.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(driver.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
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
                  onClick={() => setPage((p) => p - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasMore}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateDriverUserDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleCreate}
        isLoading={isCreating || isCreatingDriver}
      />

      <DriverDetailDialog
        driver={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        onEdit={(driver) => {
          setSelected(null);
          setEditDriver(driver);
        }}
      />

      {editDriver && (
        <EditDriverDialog
          open={!!editDriver}
          onClose={() => setEditDriver(null)}
          driver={editDriver}
          onSave={handleUpdate}
          isLoading={isUpdating}
        />
      )}
    </div>
  );
};
