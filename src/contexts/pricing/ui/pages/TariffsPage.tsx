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
import { TariffDetailDialog, TariffFormDialog, TariffDeleteDialog } from "../components/tariff";
import { useTariffs } from "../../infrastructure/hooks";
import { useZones } from "../../infrastructure/hooks";
import { useBoxes } from "@/contexts/inventory/infrastructure/hooks";
import type { TariffPrimitives } from "../../domain";

type CreateTariffData = Omit<TariffPrimitives, "id" | "createdAt" | "updatedAt">;

const COUNTRY_NAMES: Record<string, string> = { MX: "México", US: "Estados Unidos", CA: "Canadá", ES: "España", CO: "Colombia" };

const LIMIT_OPTIONS = [10, 20, 50];

export const TariffsPage = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(LIMIT_OPTIONS[0]);

  const {
    tariffs,
    pagination,
    totalPages,
    isLoading,
    refetch,
    createTariff,
    isCreating,
    updateTariff,
    isUpdating,
    deleteTariff,
    isDeleting,
  } = useTariffs({ page, limit });

  const { zones } = useZones({ page: 1, limit: 100 });
  const { boxes } = useBoxes();

  const [searchQuery, setSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [selected, setSelected] = useState<TariffPrimitives | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editTariff, setEditTariff] = useState<TariffPrimitives | null>(null);
  const [deleteTariffDialog, setDeleteTariffDialog] = useState<TariffPrimitives | null>(null);

  const getZoneName = (id: string) => zones.find((z) => z.id === id)?.name ?? id;
  const getBoxName = (id: string) => boxes.find((b) => b.id === id)?.name ?? id;

  const filtered = tariffs.filter((t) => {
    const matchesSearch =
      searchQuery === "" ||
      getZoneName(t.originZoneId).toLowerCase().includes(searchQuery.toLowerCase()) ||
      (COUNTRY_NAMES[t.destinationCountry] ?? t.destinationCountry).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCountry = countryFilter === "all" || t.destinationCountry === countryFilter;
    return matchesSearch && matchesCountry;
  });

  const handleCreate = async (data: CreateTariffData) => {
    await createTariff(data);
    setFormOpen(false);
    setPage(1);
  };

  const handleUpdate = async (data: CreateTariffData) => {
    if (!editTariff) return;
    await updateTariff(editTariff.id, data);
    setEditTariff(null);
  };

  const handleDelete = async () => {
    if (!deleteTariffDialog) return;
    await deleteTariff(deleteTariffDialog.id);
    setDeleteTariffDialog(null);
    setPage(1);
  };

  const handleEditFromDetail = (tariff: TariffPrimitives) => {
    setSelected(null);
    setEditTariff(tariff);
  };

  const handleDeleteFromDetail = (tariff: TariffPrimitives) => {
    setSelected(null);
    setDeleteTariffDialog(tariff);
  };

  const from = pagination ? pagination.offset + 1 : 0;
  const to = pagination ? pagination.offset + tariffs.length : 0;
  const total = pagination?.total ?? 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando tarifas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tarifas</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="size-4" />
          </Button>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="size-4" />
            Crear Tarifa
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por zona o país..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={countryFilter} onValueChange={setCountryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="País" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="MX">México</SelectItem>
            <SelectItem value="US">Estados Unidos</SelectItem>
            <SelectItem value="CA">Canadá</SelectItem>
            <SelectItem value="ES">España</SelectItem>
            <SelectItem value="CO">Colombia</SelectItem>
          </SelectContent>
        </Select>
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
              <TableHead>Zona origen</TableHead>
              <TableHead>País destino</TableHead>
              <TableHead className="hidden sm:table-cell">Caja</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead className="hidden lg:table-cell">Actualización</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No se encontraron tarifas.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((t) => (
                <TableRow key={t.id} className="cursor-pointer" onClick={() => setSelected(t)}>
                  <TableCell className="font-medium">{getZoneName(t.originZoneId)}</TableCell>
                  <TableCell>{COUNTRY_NAMES[t.destinationCountry] ?? t.destinationCountry}</TableCell>
                  <TableCell className="hidden sm:table-cell text-sm">{getBoxName(t.boxId)}</TableCell>
                  <TableCell className="text-right font-mono">
                    ${t.price.amount.toFixed(2)} {t.price.currency}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                    {new Date(t.updatedAt).toLocaleDateString("es-MX")}
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
      <TariffDetailDialog
        tariff={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        onEdit={handleEditFromDetail}
        onDelete={handleDeleteFromDetail}
      />
      <TariffFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleCreate}
        isLoading={isCreating}
      />
      <TariffFormDialog
        open={!!editTariff}
        onClose={() => setEditTariff(null)}
        onSave={handleUpdate}
        tariff={editTariff}
        isLoading={isUpdating}
      />
      <TariffDeleteDialog
        tariff={deleteTariffDialog}
        open={!!deleteTariffDialog}
        onClose={() => setDeleteTariffDialog(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  );
};
