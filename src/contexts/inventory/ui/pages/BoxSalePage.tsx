import { useState, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight, Download, Minus, Plus, Search, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { BoxSaleSuccessDialog } from "../components/boxSale/BoxSaleSuccessDialog";
import { BoxSaleDetailDialog } from "../components/boxSale/BoxSaleDetailDialog";
import { PageLoader } from "@contexts/shared/ui/components/PageLoader";
import {
  Input,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Separator,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@contexts/shared/shadcn";
import { exportBoxSales } from "@contexts/inventory/domain/services/exportBoxSales";
import { useBoxes } from "@contexts/inventory/infrastructure/hooks/boxes/useBoxes";
import { useBoxSales } from "@contexts/inventory/infrastructure/hooks/boxSales/useBoxSales";
import { useUsers } from "@contexts/iam/infrastructure/hooks/users/useUsers";
import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { UNIT_SHORT_LABELS } from "../components/box/constants";
import type { BoxPrimitives } from "@contexts/inventory/domain/schemas/box/Box";
import type { BoxSalePrimitives } from "@contexts/inventory/domain/schemas/boxSale/BoxSale";

const LIMIT_OPTIONS = [10, 20, 50];

interface CartItem {
  box: BoxPrimitives;
  quantity: number;
}

interface StockInfo {
  boxId: string;
  name: string;
  dimensions: string;
  soldQuantity: number;
  previousStock: number;
  remainingStock: number;
}

export const BoxSalePage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<Map<string, CartItem>>(new Map());
  const [displayCurrency, setDisplayCurrency] = useState("MXN");
  const [exchangeRate, setExchangeRate] = useState(20);

  const [salesPage, setSalesPage] = useState(1);
  const [salesLimit, setSalesLimit] = useState(LIMIT_OPTIONS[0]);

  const { boxes, isLoading } = useBoxes();
  const {
    sellBox,
    isSelling,
    sales,
    pagination: salesPagination,
    totalPages: salesTotalPages,
    isLoading: salesLoading,
    downloadReceipt,
    isDownloadingReceipt,
    printReceipt,
    isPrintingReceipt,
  } = useBoxSales({ page: salesPage, limit: salesLimit });
  const { user } = useAuth();
  const { users } = useUsers();

  const boxNames = useMemo(
    () => Object.fromEntries(boxes.map((b) => [b.id, b.name])),
    [boxes],
  );
  const userNames = useMemo(
    () => Object.fromEntries(users.map((u) => [u.id, u.name])),
    [users],
  );

  const [completedSale, setCompletedSale] = useState<BoxSalePrimitives | null>(null);
  const [saleStockInfo, setSaleStockInfo] = useState<StockInfo[]>([]);
  const [selectedSale, setSelectedSale] = useState<BoxSalePrimitives | null>(null);

  const filtered = useMemo(
    () =>
      boxes.filter((b) => {
        if (searchQuery === "") return true;
        const q = searchQuery.toLowerCase();
        const dims = `${b.dimensions.length} × ${b.dimensions.width} × ${b.dimensions.height} ${UNIT_SHORT_LABELS[b.dimensions.unit]}`;
        return (
          b.name.toLowerCase().includes(q) ||
          dims.toLowerCase().includes(q)
        );
      }),
    [boxes, searchQuery],
  );

  const getCartQty = (boxId: string) => cart.get(boxId)?.quantity ?? 0;

  const updateCart = (box: BoxPrimitives, quantity: number) => {
    setCart((prev) => {
      const next = new Map(prev);
      if (quantity <= 0) {
        next.delete(box.id);
      } else {
        next.set(box.id, { box, quantity: Math.min(quantity, box.stock) });
      }
      return next;
    });
  };

  const cartItems = useMemo(() => Array.from(cart.values()), [cart]);

  const convertPrice = (amount: number, fromCurrency: string) => {
    if (fromCurrency === displayCurrency) return amount;
    if (fromCurrency === "USD" && displayCurrency === "MXN") return amount * exchangeRate;
    if (fromCurrency === "MXN" && displayCurrency === "USD") return amount / exchangeRate;
    return amount;
  };

  const needsConversion = cartItems.some(
    (item) => item.box.price.currency !== displayCurrency,
  );

  const total = useMemo(() => {
    const convert = (amount: number, fromCurrency: string) => {
      if (fromCurrency === displayCurrency) return amount;
      if (fromCurrency === "USD" && displayCurrency === "MXN") return amount * exchangeRate;
      if (fromCurrency === "MXN" && displayCurrency === "USD") return amount / exchangeRate;
      return amount;
    };
    return cartItems.reduce(
      (sum, item) =>
        sum + convert(item.box.price.amount, item.box.price.currency) * item.quantity,
      0,
    );
  }, [cartItems, displayCurrency, exchangeRate]);

  const handleConfirmSale = async () => {
    if (!user || cartItems.length === 0) return;

    const stockSnapshot: StockInfo[] = cartItems.map((item) => {
      const d = item.box.dimensions;
      return {
        boxId: item.box.id,
        name: item.box.name,
        dimensions: `${d.length} × ${d.width} × ${d.height} ${UNIT_SHORT_LABELS[d.unit]}`,
        soldQuantity: item.quantity,
        previousStock: item.box.stock,
        remainingStock: item.box.stock - item.quantity,
      };
    });

    try {
      const sale = await sellBox({
        items: cartItems.map((item) => ({
          boxId: item.box.id,
          quantity: item.quantity,
        })),
        storeId: user.storeId,
        soldBy: user.id,
      });
      setCart(new Map());
      setSaleStockInfo(stockSnapshot);
      setCompletedSale(sale);
    } catch {
      toast.error("Error al registrar la venta");
    }
  };

  const handleCloseSuccess = useCallback(() => {
    setCompletedSale(null);
    setSaleStockInfo([]);
  }, []);

  if (isLoading) {
    return <PageLoader text="Cargando cajas..." />;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Venta de Cajas</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main area - product grid */}
        <div className="flex-[3] space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cajas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filtered.map((box) => {
              const qty = getCartQty(box.id);
              const outOfStock = box.stock === 0;

              return (
                <Card
                  key={box.id}
                  className={outOfStock ? "opacity-50 pointer-events-none" : ""}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{box.name}</CardTitle>
                      {outOfStock && (
                        <Badge variant="destructive">Sin stock</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2 space-y-1 text-sm text-muted-foreground">
                    <p>
                      {box.dimensions.length} × {box.dimensions.width} ×{" "}
                      {box.dimensions.height} {UNIT_SHORT_LABELS[box.dimensions.unit]}
                    </p>
                    <p className="text-foreground font-semibold text-lg">
                      ${box.price.amount.toFixed(2)}{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        {box.price.currency}
                      </span>
                    </p>
                    <p>Stock: {box.stock}</p>
                  </CardContent>
                  <CardFooter>
                    <div className="flex items-center gap-2 w-full">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateCart(box, qty - 1)}
                        disabled={qty === 0}
                      >
                        <Minus className="size-3" />
                      </Button>
                      <Input
                        type="number"
                        min={0}
                        max={box.stock}
                        value={qty}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          updateCart(box, isNaN(val) ? 0 : val);
                        }}
                        className="h-8 w-16 text-center [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateCart(box, qty + 1)}
                        disabled={qty >= box.stock}
                      >
                        <Plus className="size-3" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-12">
              No se encontraron cajas.
            </p>
          )}
        </div>

        {/* Sidebar - cart summary */}
        <div className="flex-1 lg:min-w-[280px]">
          <div className="lg:sticky lg:top-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="size-5" />
                  Resumen de Venta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Moneda</label>
                  <Select value={displayCurrency} onValueChange={setDisplayCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MXN">MXN</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {needsConversion && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium">1 USD =</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={exchangeRate}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setExchangeRate(isNaN(val) ? 0 : val);
                        }}
                        className="h-8 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      <span className="text-sm text-muted-foreground">MXN</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Recuerda revisar el cambio actual</p>
                  </div>
                )}

                <Separator />

                {cartItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Agrega cajas para comenzar
                  </p>
                ) : (
                  <>
                    {cartItems.map((item) => {
                      const subtotal =
                        convertPrice(item.box.price.amount, item.box.price.currency) *
                        item.quantity;
                      return (
                        <div
                          key={item.box.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{item.box.name}</p>
                            <p className="text-muted-foreground">
                              x{item.quantity}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono">
                              ${subtotal.toFixed(2)} {displayCurrency}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => updateCart(item.box, 0)}
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                    <Separator />
                    <div className="flex items-center justify-between font-semibold">
                      <span>Total</span>
                      <span className="font-mono text-lg">
                        ${total.toFixed(2)} {displayCurrency}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  disabled={cartItems.length === 0 || isSelling || (needsConversion && exchangeRate <= 0)}
                  onClick={handleConfirmSale}
                >
                  {isSelling ? "Procesando..." : "Confirmar Venta"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>

      {/* Sales history */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Historial de Ventas</h2>
          <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => exportBoxSales(sales, boxNames, userNames)}>
            <Download className="size-4" />
            Exportar XLSX
          </Button>
          <Select
            value={String(salesLimit)}
            onValueChange={(v) => {
              setSalesLimit(Number(v));
              setSalesPage(1);
            }}
          >
            <SelectTrigger className="w-[130px]">
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
        </div>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Folio</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="hidden sm:table-cell">Vendedor</TableHead>
                <TableHead className="text-center">Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salesLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center">
                    <p className="text-muted-foreground">Cargando ventas...</p>
                  </TableCell>
                </TableRow>
              ) : sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center">
                    <p className="text-muted-foreground">No hay ventas registradas.</p>
                  </TableCell>
                </TableRow>
              ) : (
                sales.map((sale) => (
                  <TableRow key={sale.id} className="cursor-pointer" onClick={() => setSelectedSale(sale)}>
                    <TableCell className="font-mono text-xs">
                      {sale.id.slice(0, 8).toUpperCase()}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(sale.createdAt).toLocaleString("es-MX")}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">
                      {userNames[sale.soldBy] ?? sale.soldBy.slice(0, 8)}
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
      </div>

      <BoxSaleDetailDialog
        sale={selectedSale}
        open={!!selectedSale}
        onClose={() => setSelectedSale(null)}
        boxNames={boxNames}
        userNames={userNames}
        onDownloadReceipt={downloadReceipt}
        isDownloadingReceipt={isDownloadingReceipt}
        onPrintReceipt={printReceipt}
        isPrintingReceipt={isPrintingReceipt}
      />

      <BoxSaleSuccessDialog
        sale={completedSale}
        stockInfo={saleStockInfo}
        open={!!completedSale}
        onClose={handleCloseSuccess}
        onPrintReceipt={printReceipt}
        isPrintingReceipt={isPrintingReceipt}
      />
    </div>
  );
};
