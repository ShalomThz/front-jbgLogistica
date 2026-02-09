import { useState } from "react";
import { ChevronLeft, ChevronRight, Minus, Plus, RefreshCw, Search } from "lucide-react";
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
import { BoxDetailDialog, BoxFormDialog, BoxDeleteDialog, BoxStockDialog } from "../components/box";
import { useBoxes } from "../../infrastructure/hooks";
import type { BoxPrimitives, CreateBoxRequestPrimitives } from "../../domain";

type StockOperation = "add" | "subtract";

const UNIT_LABELS: Record<string, string> = { cm: "cm", in: "in" };

const LIMIT_OPTIONS = [10, 20, 50];

export const BoxPage = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(LIMIT_OPTIONS[0]);

  const {
    boxes,
    pagination,
    totalPages,
    isLoading,
    refetch,
    createBox,
    isCreating,
    updateBox,
    isUpdating,
    deleteBox,
    isDeleting,
  } = useBoxes({ page, limit });

  const [searchQuery, setSearchQuery] = useState("");
  const [unitFilter, setUnitFilter] = useState<string>("all");
  const [selected, setSelected] = useState<BoxPrimitives | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editBox, setEditBox] = useState<BoxPrimitives | null>(null);
  const [deleteBoxDialog, setDeleteBoxDialog] = useState<BoxPrimitives | null>(null);
  const [stockBox, setStockBox] = useState<BoxPrimitives | null>(null);
  const [stockOperation, setStockOperation] = useState<StockOperation | null>(null);

  const filtered = boxes.filter((b) => {
    const matchesSearch = searchQuery === "" || b.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesUnit = unitFilter === "all" || b.dimensions.unit === unitFilter;
    return matchesSearch && matchesUnit;
  });

  const handleCreate = async (data: CreateBoxRequestPrimitives) => {
    await createBox(data);
    setFormOpen(false);
    setPage(1);
  };

  const handleUpdate = async (data: CreateBoxRequestPrimitives) => {
    if (!editBox) return;
    await updateBox(editBox.id, data);
    setEditBox(null);
  };

  const handleDelete = async () => {
    if (!deleteBoxDialog) return;
    await deleteBox(deleteBoxDialog.id);
    setDeleteBoxDialog(null);
    setPage(1);
  };

  const handleEditFromDetail = (box: BoxPrimitives) => {
    setSelected(null);
    setEditBox(box);
  };

  const handleDeleteFromDetail = (box: BoxPrimitives) => {
    setSelected(null);
    setDeleteBoxDialog(box);
  };

  const handleStockConfirm = async (boxId: string, newStock: number) => {
    await updateBox(boxId, { stock: newStock });
  };

  const openStockDialog = (box: BoxPrimitives, operation: StockOperation) => {
    setStockBox(box);
    setStockOperation(operation);
  };

  const closeStockDialog = () => {
    setStockBox(null);
    setStockOperation(null);
  };

  const from = pagination ? pagination.offset + 1 : 0;
  const to = pagination ? pagination.offset + boxes.length : 0;
  const total = pagination?.total ?? 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando cajas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cajas</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="size-4" />
          </Button>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="size-4" />
            Crear Caja
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input placeholder="Buscar por nombre..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={unitFilter} onValueChange={setUnitFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Unidad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="cm">Centímetros</SelectItem>
            <SelectItem value="in">Pulgadas</SelectItem>
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
              <TableHead>Nombre</TableHead>
              <TableHead>Dimensiones</TableHead>
              <TableHead className="hidden sm:table-cell">Unidad</TableHead>
              <TableHead className="text-center">Stock</TableHead>
              <TableHead className="hidden lg:table-cell">Creación</TableHead>
              <TableHead className="text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No se encontraron cajas.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((b) => (
                <TableRow key={b.id} className="cursor-pointer" onClick={() => setSelected(b)}>
                  <TableCell className="font-medium">{b.name}</TableCell>
                  <TableCell>{b.dimensions.length} x {b.dimensions.width} x {b.dimensions.height}</TableCell>
                  <TableCell className="hidden sm:table-cell">{UNIT_LABELS[b.dimensions.unit]}</TableCell>
                  <TableCell className="text-center font-medium">{b.stock}</TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                    {new Date(b.createdAt).toLocaleDateString("es-MX")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="outline" size="sm" className="h-7 px-2" onClick={(e) => { e.stopPropagation(); openStockDialog(b, "add"); }}>
                        <Plus className="size-3 mr-1" />Agregar
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 px-2" onClick={(e) => { e.stopPropagation(); openStockDialog(b, "subtract"); }} disabled={b.stock === 0}>
                        <Minus className="size-3 mr-1" />Descontar
                      </Button>
                    </div>
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
      <BoxDetailDialog box={selected} open={!!selected} onClose={() => setSelected(null)} onEdit={handleEditFromDetail} onDelete={handleDeleteFromDetail} />
      <BoxFormDialog open={formOpen} onClose={() => setFormOpen(false)} onSave={handleCreate} isLoading={isCreating} />
      <BoxFormDialog open={!!editBox} onClose={() => setEditBox(null)} onSave={handleUpdate} box={editBox} isLoading={isUpdating} />
      <BoxDeleteDialog box={deleteBoxDialog} open={!!deleteBoxDialog} onClose={() => setDeleteBoxDialog(null)} onConfirm={handleDelete} isLoading={isDeleting} />
      <BoxStockDialog box={stockBox} operation={stockOperation} open={!!stockBox} onClose={closeStockDialog} onConfirm={handleStockConfirm} />
    </div>
  );
};
