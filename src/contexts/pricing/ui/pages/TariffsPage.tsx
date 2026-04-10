import { useState } from "react";
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
import { TariffDetailDialog } from "../components/tariff/TariffDetailDialog";
import { TariffFormDialog } from "../components/tariff/TariffFormDialog";
import { TariffDeleteDialog } from "../components/tariff/TariffDeleteDialog";
import { TariffFilters } from "../components/tariff/TariffFilters";
import { exportTariffs } from "@contexts/pricing/domain/services/exportTariffs";
import { useTariffs } from "@contexts/pricing/infrastructure/hooks/tariffs/useTariffs";
import { useTariffFilters } from "../hooks/useTariffFilters";
import type { TariffListViewPrimitives } from "@contexts/pricing/domain/schemas/tariff/TariffListView";
import type { CreateTariffRequestPrimitives } from "@contexts/pricing/domain/schemas/tariff/Tariff";
import { useCountries } from "@contexts/shared/infrastructure/hooks/useCountries";

const LIMIT_OPTIONS = [10, 20, 50];

export const TariffsPage = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(LIMIT_OPTIONS[0]);

  const { countries } = useCountries();
  const countryNames: Record<string, string> = Object.fromEntries(
    countries.map((c) => [c.code, c.name]),
  );

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

  const { filters, setFilter, resetFilters, filtered, options } = useTariffFilters(tariffs, { countryNames });

  const [selected, setSelected] = useState<TariffListViewPrimitives | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editTariff, setEditTariff] = useState<TariffListViewPrimitives | null>(null);
  const [deleteTariffDialog, setDeleteTariffDialog] = useState<TariffListViewPrimitives | null>(null);

  const handleCreate = async (data: CreateTariffRequestPrimitives) => {
    await createTariff(data);
    setFormOpen(false);
    setPage(1);
  };

  const handleUpdate = async (data: CreateTariffRequestPrimitives) => {
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

  const handleEditFromDetail = (tariff: TariffListViewPrimitives) => {
    setSelected(null);
    setEditTariff(tariff);
  };

  const handleDeleteFromDetail = (tariff: TariffListViewPrimitives) => {
    setSelected(null);
    setDeleteTariffDialog(tariff);
  };

  const from = pagination ? pagination.offset + 1 : 0;
  const to = pagination ? pagination.offset + tariffs.length : 0;
  const total = pagination?.total ?? 0;

  if (isLoading) {
    return <PageLoader text="Cargando tarifas..." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tarifas</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => { resetFilters(); refetch(); }}>
            <RefreshCw className="size-4" />
          </Button>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="size-4" />
            Crear Tarifa
          </Button>
        </div>
      </div>
      <TariffFilters
        filters={filters}
        options={options}
        limit={limit}
        limitOptions={LIMIT_OPTIONS}
        setFilter={setFilter}
        onLimitChange={(v) => { setLimit(v); setPage(1); }}
        onResetAndRefetch={() => { resetFilters(); refetch(); }}
        onExport={() => exportTariffs(filtered)}
      />
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
                  <TableCell className="font-medium">{t.zone.name}</TableCell>
                  <TableCell>{countryNames[t.destinationCountry] ?? t.destinationCountry}</TableCell>
                  <TableCell className="hidden sm:table-cell text-sm">{t.box.name}</TableCell>
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
