import {
  AlignLeft,
  CalendarClock,
  CalendarPlus,
  Globe,
  Map,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { parseApiError } from "@contexts/shared/infrastructure/http/errors/parseApiError";
import { useCountries } from "@contexts/shared/infrastructure/hooks/useCountries";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, RefreshCw } from "lucide-react";
import { PageLoader } from "@contexts/shared/ui/components/PageLoader";
import {
  Button,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@contexts/shared/shadcn";
import { ZoneDetailDialog } from "../components/zone/ZoneDetailDialog";
import { ZoneFormDialog } from "../components/zone/ZoneFormDialog";
import { ZoneDeleteDialog } from "../components/zone/ZoneDeleteDialog";
import { ZoneFilters, type ZoneFilterOptions } from "../components/zone/ZoneFilters";
import { exportZones } from "@contexts/pricing/domain/services/exportZones";
import { useZones } from "@contexts/pricing/infrastructure/hooks/zones/useZones";
import { useZoneFilters } from "../hooks/useZoneFilters";
import type { ZonePrimitives } from "@contexts/pricing/domain/schemas/zone/Zone";
import type { CreateZoneRequestPrimitives } from "@contexts/pricing/domain/schemas/zone/Zone";
import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { pricingPolicies } from "@contexts/shared/domain/policies/pricing.policy";

const LIMIT_OPTIONS = [10, 20, 50];

export const ZonesPage = () => {
  const { countries } = useCountries();
  const countryNames: Record<string, string> = Object.fromEntries(
    countries.map((c) => [c.code, c.name]),
  );

  // Las opciones salen del catálogo completo y no de la página visible: filtrar
  // por un estado que quedó en la página 3 tiene que ser posible.
  const { zones: allZones } = useZones();

  const { user } = useAuth();
  const canViewReports = user ? pricingPolicies.viewZoneReports(user) : false;
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(LIMIT_OPTIONS[0]);

  const { state: filters, setFilter, reset: resetFilters, criteria } = useZoneFilters();

  const filterOptions = useMemo<ZoneFilterOptions>(() => {
    const countryCodes = [...new Set(allZones.map((z) => z.country))].filter(Boolean);
    const states = [
      ...new Set(
        allZones
          .filter((z) => !filters.country || z.country === filters.country)
          .map((z) => z.state)
          .filter(Boolean),
      ),
    ].sort((a, b) => a.localeCompare(b));

    return {
      countries: countryCodes
        .map((code) => ({ code, name: countryNames[code] ?? code }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      states,
    };
  }, [allZones, filters.country, countryNames]);

  const [prevCriteria, setPrevCriteria] = useState(criteria);
  if (criteria !== prevCriteria) {
    setPrevCriteria(criteria);
    setPage(1);
  }

  const {
    zones,
    pagination,
    totalPages,
    isLoading,
    refetch,
    createZone,
    isCreating,
    updateZone,
    isUpdating,
    deleteZone,
    isDeleting,
  } = useZones({ page, limit, ...criteria });

  const [selected, setSelected] = useState<ZonePrimitives | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editZone, setEditZone] = useState<ZonePrimitives | null>(null);
  const [deleteZoneDialog, setDeleteZoneDialog] = useState<ZonePrimitives | null>(null);

  // El servidor rechaza el alta por nombre repetido en el estado, y el borrado
  // por zona en uso. Sin esto el diálogo se queda abierto y sin decir por qué.
  const handleCreate = async (data: CreateZoneRequestPrimitives) => {
    try {
      await createZone(data);
      setFormOpen(false);
      setPage(1);
    } catch (err) {
      toast.error(parseApiError(err));
    }
  };

  const handleUpdate = async (data: CreateZoneRequestPrimitives) => {
    if (!editZone) return;
    try {
      await updateZone(editZone.id, data);
      setEditZone(null);
    } catch (err) {
      toast.error(parseApiError(err));
    }
  };

  const handleDelete = async () => {
    if (!deleteZoneDialog) return;
    try {
      await deleteZone(deleteZoneDialog.id);
      setDeleteZoneDialog(null);
      setPage(1);
    } catch (err) {
      toast.error(parseApiError(err));
    }
  };

  const handleEditFromDetail = (zone: ZonePrimitives) => {
    setSelected(null);
    setEditZone(zone);
  };

  const handleDeleteFromDetail = (zone: ZonePrimitives) => {
    setSelected(null);
    setDeleteZoneDialog(zone);
  };

  const from = pagination ? pagination.offset + 1 : 0;
  const to = pagination ? pagination.offset + zones.length : 0;
  const total = pagination?.total ?? 0;

  if (isLoading) {
    return <PageLoader text="Cargando zonas..." />;
  }

  return (
    <div className="flex flex-col h-full min-h-0 gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Zonas</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => { resetFilters(); refetch(); }}>
            <RefreshCw className="size-4" />
          </Button>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="size-4" />
            Crear Zona
          </Button>
        </div>
      </div>
      <ZoneFilters
        filters={filters}
        options={filterOptions}
        limit={limit}
        limitOptions={LIMIT_OPTIONS}
        setFilter={setFilter}
        onLimitChange={(v) => { setLimit(v); setPage(1); }}
        onResetAndRefetch={() => { resetFilters(); refetch(); }}
        onExport={canViewReports ? () => exportZones(zones) : undefined}
      />
      <div className="rounded-lg border min-h-0 overflow-hidden [&>div]:max-h-full [&>div]:overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow>
              <TableHead>
                <span className="flex items-center gap-1.5">
                  <Tag className="size-3.5" />
                  Nombre
                </span>
              </TableHead>
              <TableHead>
                <span className="flex items-center gap-1.5">
                  <Map className="size-3.5" />
                  Estado
                </span>
              </TableHead>
              <TableHead className="hidden md:table-cell">
                <span className="flex items-center gap-1.5">
                  <Globe className="size-3.5" />
                  País
                </span>
              </TableHead>
              <TableHead className="hidden sm:table-cell">
                <span className="flex items-center gap-1.5">
                  <AlignLeft className="size-3.5" />
                  Descripción
                </span>
              </TableHead>
              <TableHead className="hidden lg:table-cell">
                <span className="flex items-center gap-1.5">
                  <CalendarPlus className="size-3.5" />
                  Creación
                </span>
              </TableHead>
              <TableHead className="hidden lg:table-cell">
                <span className="flex items-center gap-1.5">
                  <CalendarClock className="size-3.5" />
                  Actualización
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {zones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No se encontraron zonas.
                </TableCell>
              </TableRow>
            ) : (
              zones.map((z) => (
                <TableRow key={z.id} className="cursor-pointer" onClick={() => setSelected(z)}>
                  <TableCell className="font-medium">{z.name}</TableCell>
                  <TableCell className="text-sm">
                    {z.state || (
                      <span className="text-muted-foreground/60">Sin definir</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {countryNames[z.country] ?? z.country}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                    {z.description || "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                    {new Date(z.createdAt).toLocaleDateString("es-MX")}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                    {new Date(z.updatedAt).toLocaleDateString("es-MX")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {pagination && total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {from}-{to} de {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="size-4" />
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!pagination.hasMore}
            >
              Siguiente
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
      <ZoneDetailDialog
        zone={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        onEdit={handleEditFromDetail}
        onDelete={handleDeleteFromDetail}
      />
      <ZoneFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleCreate}
        isLoading={isCreating}
      />
      <ZoneFormDialog
        open={!!editZone}
        onClose={() => setEditZone(null)}
        onSave={handleUpdate}
        zone={editZone}
        isLoading={isUpdating}
      />
      <ZoneDeleteDialog
        zone={deleteZoneDialog}
        open={!!deleteZoneDialog}
        onClose={() => setDeleteZoneDialog(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  );
};
