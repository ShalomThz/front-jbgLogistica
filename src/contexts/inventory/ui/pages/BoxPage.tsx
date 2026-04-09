import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowDownAZ, ChevronLeft, ChevronRight, Clock, Filter, Minus, Plus, RefreshCw, Search, ShoppingCart } from "lucide-react";
import { PageLoader } from "@contexts/shared/ui/components/PageLoader";
import {
  Input,
  Button,
  Label,
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@contexts/shared/shadcn";
import boxIsometricSvg from "@/assets/box-isometric.svg";
import { BoxDetailDialog } from "../components/box/BoxDetailDialog";
import { BoxFormDialog } from "../components/box/BoxFormDialog";
import { BoxDeleteDialog } from "../components/box/BoxDeleteDialog";
import { BoxStockDialog } from "../components/box/BoxStockDialog";
import { BoxSaleDetailDialog } from "../components/boxSale/BoxSaleDetailDialog";
import { useBoxes } from "@contexts/inventory/infrastructure/hooks/boxes/useBoxes";
import { useBoxSales } from "@contexts/inventory/infrastructure/hooks/boxSales/useBoxSales";
import { useUsers } from "@contexts/iam/infrastructure/hooks/users/useUsers";
import type { BoxPrimitives, CreateBoxRequestPrimitives } from "@contexts/inventory/domain/schemas/box/Box";
import type { BoxSalePrimitives } from "@contexts/inventory/domain/schemas/boxSale/BoxSale";
import { UNIT_SHORT_LABELS } from "../components/box/constants";

type StockOperation = "add" | "subtract";

const LIMIT_OPTIONS = [10, 20, 50];

export const BoxPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("stock");
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

  const [salesPage, setSalesPage] = useState(1);
  const [salesLimit, setSalesLimit] = useState(LIMIT_OPTIONS[0]);
  const {
    sales,
    pagination: salesPagination,
    totalPages: salesTotalPages,
    isLoading: salesLoading,
    downloadReceipt,
    isDownloadingReceipt,
    printReceipt,
    isPrintingReceipt,
  } = useBoxSales({ page: salesPage, limit: salesLimit, enabled: activeTab === "sales" });

  const { users } = useUsers({ limit: 100 });

  const boxNames = useMemo(
    () => Object.fromEntries(boxes.map((b) => [b.id, b.name])),
    [boxes],
  );
  const userNames = useMemo(
    () => Object.fromEntries(users.map((u) => [u.id, u.name])),
    [users],
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [unitFilter, setUnitFilter] = useState<string>("all");
  const [nameSort, setNameSort] = useState<"none" | "asc" | "desc">("none");
  const [dateSort, setDateSort] = useState<"none" | "asc" | "desc">("desc");

  const handleNameSort = (v: "none" | "asc" | "desc") => {
    setNameSort(v);
    if (v !== "none") setDateSort("none");
  };
  const handleDateSort = (v: "none" | "asc" | "desc") => {
    setDateSort(v);
    if (v !== "none") setNameSort("none");
  };
  const resetFilters = () => {
    setSearchQuery("");
    setUnitFilter("all");
    setNameSort("none");
    setDateSort("desc");
  };
  const activeFilterCount =
    (unitFilter !== "all" ? 1 : 0) +
    (nameSort !== "none" ? 1 : 0) +
    (dateSort !== "none" ? 1 : 0);

  const [selected, setSelected] = useState<BoxPrimitives | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editBox, setEditBox] = useState<BoxPrimitives | null>(null);
  const [deleteBoxDialog, setDeleteBoxDialog] = useState<BoxPrimitives | null>(null);
  const [stockBox, setStockBox] = useState<BoxPrimitives | null>(null);
  const [stockOperation, setStockOperation] = useState<StockOperation | null>(null);
  const [selectedSale, setSelectedSale] = useState<BoxSalePrimitives | null>(null);


  const filtered = (() => {
    const result = boxes.filter((b) => {
      const matchesSearch = searchQuery === "" || b.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesUnit = unitFilter === "all" || b.dimensions.unit === unitFilter;
      return matchesSearch && matchesUnit;
    });
    if (dateSort === "asc") result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    else if (dateSort === "desc") result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (nameSort === "asc") result.sort((a, b) => a.name.localeCompare(b.name));
    else if (nameSort === "desc") result.sort((a, b) => b.name.localeCompare(a.name));
    return result;
  })();

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
    return <PageLoader text="Cargando cajas..." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cajas</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => { resetFilters(); refetch(); }}>
            <RefreshCw className="size-4" />
          </Button>
          <Button variant="outline" onClick={() => navigate("/box-sales")}>
            <ShoppingCart className="size-4" />
            Vender
          </Button>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="size-4" />
            Crear Caja
          </Button>
        </div>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="stock">Stock</TabsTrigger>
          <TabsTrigger value="sales">Ventas</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input placeholder="Buscar por nombre..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
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
                    {opt} por pagina
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant={activeFilterCount > 0 ? "secondary" : "outline"} size="sm" className="gap-1.5">
                  <Filter className="size-4" />
                  Filtros
                  {activeFilterCount > 0 && (
                    <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filtros y orden</SheetTitle>
                  <SheetDescription>Filtra y ordena las cajas por diferentes criterios</SheetDescription>
                </SheetHeader>
                <div className="space-y-5 px-4">
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <ArrowDownAZ className="size-3.5" />
                      Ordenar por nombre
                    </Label>
                    <Select value={nameSort} onValueChange={(v) => handleNameSort(v as "none" | "asc" | "desc")}>
                      <SelectTrigger className={nameSort !== "none" ? "ring-2 ring-primary/50" : ""}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin orden</SelectItem>
                        <SelectItem value="asc">A-Z</SelectItem>
                        <SelectItem value="desc">Z-A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="size-3.5" />
                      Ordenar por fecha
                    </Label>
                    <Select value={dateSort} onValueChange={(v) => handleDateSort(v as "none" | "asc" | "desc")}>
                      <SelectTrigger className={dateSort !== "none" ? "ring-2 ring-primary/50" : ""}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin orden</SelectItem>
                        <SelectItem value="desc">Mas reciente</SelectItem>
                        <SelectItem value="asc">Mas antiguo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <hr />
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Filter className="size-3.5" />
                      Unidad
                    </Label>
                    <Select value={unitFilter} onValueChange={setUnitFilter}>
                      <SelectTrigger className={unitFilter !== "all" ? "ring-2 ring-primary/50" : ""}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="cm">Centimetros</SelectItem>
                        <SelectItem value="in">Pulgadas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline" className="w-full gap-2" onClick={() => { resetFilters(); refetch(); }}>
                    <RefreshCw className="size-4" />
                    Limpiar filtros y actualizar
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Dimensiones</TableHead>
                  <TableHead className="hidden sm:table-cell">Unidad</TableHead>
                  <TableHead className="hidden md:table-cell text-right">Precio venta unitario</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                  <TableHead className="hidden lg:table-cell">Creación</TableHead>
                  <TableHead className="text-center">Inventario</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-48 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <img src={boxIsometricSvg} alt="Sin cajas" className="w-24 h-auto opacity-60" />
                        <p className="text-muted-foreground">No se encontraron cajas.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((b) => (
                    <TableRow key={b.id} className={`cursor-pointer${b.stock === 0 ? " bg-destructive/5 hover:bg-destructive/10" : ""}`} onClick={() => setSelected(b)}>
                      <TableCell className="font-medium">{b.name}</TableCell>
                      <TableCell>{b.dimensions.length} x {b.dimensions.width} x {b.dimensions.height}</TableCell>
                      <TableCell className="hidden sm:table-cell">{UNIT_SHORT_LABELS[b.dimensions.unit]}</TableCell>
                      <TableCell className="hidden md:table-cell text-right font-mono">${b.price.amount.toFixed(2)} {b.price.currency}</TableCell>
                      <TableCell className={`text-center font-medium${b.stock === 0 ? " text-destructive" : ""}`}>{b.stock === 0 ? "Sin stock" : b.stock}</TableCell>
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
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <div className="flex justify-end">
            <Select
              value={String(salesLimit)}
              onValueChange={(v) => {
                setSalesLimit(Number(v));
                setSalesPage(1);
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
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-center">Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-48 text-center">
                      <p className="text-muted-foreground">Cargando ventas...</p>
                    </TableCell>
                  </TableRow>
                ) : sales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-48 text-center">
                      <p className="text-muted-foreground">No hay ventas registradas.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  sales.map((sale) => (
                    <TableRow key={sale.id} className="cursor-pointer" onClick={() => setSelectedSale(sale)}>
                      <TableCell className="text-sm">
                        {new Date(sale.createdAt).toLocaleString("es-MX")}
                      </TableCell>
                      <TableCell className="text-center">{sale.items.length}</TableCell>
                      <TableCell className="text-right font-mono">
                        ${sale.totalAmount.amount.toFixed(2)} {sale.totalAmount.currency}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {salesPagination && salesPagination.total > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Mostrando {salesPagination.offset + 1}-{salesPagination.offset + sales.length} de {salesPagination.total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSalesPage((p) => p - 1)}
                  disabled={salesPage <= 1}
                >
                  <ChevronLeft className="size-4" />
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  {salesPage} / {salesTotalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSalesPage((p) => p + 1)}
                  disabled={!salesPagination.hasMore}
                >
                  Siguiente
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <BoxDetailDialog box={selected} open={!!selected} onClose={() => setSelected(null)} onEdit={handleEditFromDetail} onDelete={handleDeleteFromDetail} />
      <BoxFormDialog open={formOpen} onClose={() => setFormOpen(false)} onSave={handleCreate} isLoading={isCreating} />
      <BoxFormDialog open={!!editBox} onClose={() => setEditBox(null)} onSave={handleUpdate} box={editBox} isLoading={isUpdating} />
      <BoxDeleteDialog box={deleteBoxDialog} open={!!deleteBoxDialog} onClose={() => setDeleteBoxDialog(null)} onConfirm={handleDelete} isLoading={isDeleting} />
      <BoxStockDialog box={stockBox} operation={stockOperation} open={!!stockBox} onClose={closeStockDialog} onConfirm={handleStockConfirm} />
      <BoxSaleDetailDialog sale={selectedSale} open={!!selectedSale} onClose={() => setSelectedSale(null)} boxNames={boxNames} userNames={userNames} onDownloadReceipt={downloadReceipt} isDownloadingReceipt={isDownloadingReceipt} onPrintReceipt={printReceipt} isPrintingReceipt={isPrintingReceipt} />
    </div>
  );
};
