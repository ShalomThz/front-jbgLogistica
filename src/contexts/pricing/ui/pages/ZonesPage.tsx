import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, RefreshCw, Search } from "lucide-react";
import {
  Input,
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
import { ZoneDetailDialog, ZoneFormDialog, ZoneDeleteDialog } from "../components/zone";
import { useZones } from "../../infrastructure/hooks";
import type { ZonePrimitives } from "../../domain";

type CreateZoneData = Omit<ZonePrimitives, "id" | "createdAt" | "updatedAt">;

const LIMIT_OPTIONS = [10, 20, 50];

export const ZonesPage = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(LIMIT_OPTIONS[0]);

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
  } = useZones({ page, limit });

  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<ZonePrimitives | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editZone, setEditZone] = useState<ZonePrimitives | null>(null);
  const [deleteZoneDialog, setDeleteZoneDialog] = useState<ZonePrimitives | null>(null);

  const filtered = zones.filter(
    (z) =>
      searchQuery === "" ||
      z.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      z.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCreate = async (data: CreateZoneData) => {
    await createZone(data);
    setFormOpen(false);
    setPage(1);
  };

  const handleUpdate = async (data: CreateZoneData) => {
    if (!editZone) return;
    await updateZone(editZone.id, data);
    setEditZone(null);
  };

  const handleDelete = async () => {
    if (!deleteZoneDialog) return;
    await deleteZone(deleteZoneDialog.id);
    setDeleteZoneDialog(null);
    setPage(1);
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
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando zonas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Zonas</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="size-4" />
          </Button>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="size-4" />
            Crear Zona
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o descripción..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={String(limit)}
          onValueChange={(v) => {
            setLimit(Number(v));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LIMIT_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={String(opt)}>
                {opt} por página
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead className="hidden sm:table-cell">Descripción</TableHead>
              <TableHead className="hidden lg:table-cell">Creación</TableHead>
              <TableHead className="hidden lg:table-cell">Actualización</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No se encontraron zonas.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((z) => (
                <TableRow key={z.id} className="cursor-pointer" onClick={() => setSelected(z)}>
                  <TableCell className="font-medium">{z.name}</TableCell>
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
