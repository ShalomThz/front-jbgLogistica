import { useState } from "react";
import { ArrowDownAZ, ChevronLeft, ChevronRight, Clock, Plus, RefreshCw, Search } from "lucide-react";
import { PageLoader } from "@contexts/shared/ui/components/PageLoader";
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
} from "@contexts/shared/shadcn";
import { TariffDetailDialog } from "../components/tariff/TariffDetailDialog";
import { TariffFormDialog } from "../components/tariff/TariffFormDialog";
import { TariffDeleteDialog } from "../components/tariff/TariffDeleteDialog";
import { useTariffs } from "@contexts/pricing/infrastructure/hooks/tariffs/useTariffs";
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

  const [searchQuery, setSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [nameSort, setNameSort] = useState<"none" | "asc" | "desc">("none");
  const [dateSort, setDateSort] = useState<"none" | "asc" | "desc">("none");
  const [selected, setSelected] = useState<TariffListViewPrimitives | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editTariff, setEditTariff] = useState<TariffListViewPrimitives | null>(null);
  const [deleteTariffDialog, setDeleteTariffDialog] = useState<TariffListViewPrimitives | null>(null);

  const filtered = (() => {
    const result = tariffs.filter((t) => {
      const matchesSearch =
        searchQuery === "" ||
        t.zone.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (countryNames[t.destinationCountry] ?? t.destinationCountry).toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCountry = countryFilter === "all" || t.destinationCountry === countryFilter;
      return matchesSearch && matchesCountry;
    });
    if (nameSort === "asc") result.sort((a, b) => a.zone.name.localeCompare(b.zone.name));
    else if (nameSort === "desc") result.sort((a, b) => b.zone.name.localeCompare(a.zone.name));
    else if (dateSort === "asc") result.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
    else if (dateSort === "desc") result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return result;
  })();

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
            {countries.map((c) => (
              <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
            ))}
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
        <Select value={nameSort} onValueChange={(v) => { setNameSort(v as "none" | "asc" | "desc"); if (v !== "none") setDateSort("none"); }}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <ArrowDownAZ className="size-4 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nombre</SelectItem>
            <SelectItem value="asc">Nombre A-Z</SelectItem>
            <SelectItem value="desc">Nombre Z-A</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dateSort} onValueChange={(v) => { setDateSort(v as "none" | "asc" | "desc"); if (v !== "none") setNameSort("none"); }}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <Clock className="size-4 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Creacion</SelectItem>
            <SelectItem value="desc">Mas reciente</SelectItem>
            <SelectItem value="asc">Mas antiguo</SelectItem>
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
