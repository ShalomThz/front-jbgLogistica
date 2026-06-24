import { useState, useMemo, useCallback, useEffect } from "react";
import { AlertCircle, Minus, Plus, RefreshCw, Search, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { BoxSaleSuccessDialog } from "../components/boxSale/BoxSaleSuccessDialog";
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
} from "@contexts/shared/shadcn";
import { useBoxes } from "@contexts/inventory/infrastructure/hooks/boxes/useBoxes";
import { useBoxSales } from "@contexts/inventory/infrastructure/hooks/boxSales/useBoxSales";
import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { useExchangeRate } from "@contexts/shared/infrastructure/hooks/useExchangeRate";
import { UNIT_SHORT_LABELS } from "../components/box/constants";
import type { BoxPrimitives } from "@contexts/inventory/domain/schemas/box/Box";
import type { BoxSalePrimitives } from "@contexts/inventory/domain/schemas/boxSale/BoxSale";
import boxIsometricSvg from "@/assets/box-isometric.svg";

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
  const [customerName, setCustomerName] = useState("");
  const [displayCurrency, setDisplayCurrency] = useState("USD");
  const {
    exchangeRate: liveRate,
    isLoadingRate,
    isFetchingRate,
    isRateError,
    rateError,
    invalidateRate,
  } = useExchangeRate({
    from: "USD",
    to: "MXN",
  });
  const exchangeRate = liveRate?.rate ?? 0;

  useEffect(() => {
    if (isRateError) {
      toast.error("Error al obtener el tipo de cambio", {
        description: rateError ?? "No se pudo contactar al servicio de exchange.",
      });
    }
  }, [isRateError, rateError]);

  const { boxes, isLoading } = useBoxes();
  const {
    sellBox,
    isSelling,
    printReceipt,
    isPrintingReceipt,
  } = useBoxSales({ enabled: false });
  const { user } = useAuth();

  const [completedSale, setCompletedSale] = useState<BoxSalePrimitives | null>(null);
  const [saleStockInfo, setSaleStockInfo] = useState<StockInfo[]>([]);

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
      const trimmedCustomer = customerName.trim();
      const sale = await sellBox({
        items: cartItems.map((item) => ({
          boxId: item.box.id,
          quantity: item.quantity,
        })),
        currency: displayCurrency,
        customerName: trimmedCustomer.length > 0 ? trimmedCustomer : undefined,
        storeId: user.store.id,
        soldBy: user.id,
      });
      setCart(new Map());
      setCustomerName("");
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
    <div className="flex flex-col h-full min-h-0 space-y-4">
      <h1 className="text-2xl font-bold shrink-0">Venta de Cajas</h1>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Main area - product grid */}
        <div className="flex-[3] flex flex-col min-h-0 space-y-4">
          <div className="relative shrink-0">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cajas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto pr-1">
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
                    <div className="flex justify-center rounded-md bg-muted/40 py-3">
                      <img
                        src={boxIsometricSvg}
                        alt={box.name}
                        className="h-20 w-auto object-contain"
                      />
                    </div>
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
        </div>

        {/* Sidebar - cart summary */}
        <div className="flex-1 lg:min-w-[280px] lg:min-h-0 lg:overflow-y-auto">
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="size-5" />
                  Resumen de Venta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="customerName">
                    Cliente <span className="text-muted-foreground font-normal">(opcional)</span>
                  </label>
                  <Input
                    id="customerName"
                    placeholder="Nombre del cliente"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>

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
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tipo de cambio</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono">
                          {isLoadingRate
                            ? "Cargando..."
                            : isRateError
                              ? "—"
                              : `1 USD = ${exchangeRate.toFixed(2)} MXN`}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6"
                          title="Actualizar tipo de cambio"
                          onClick={() => invalidateRate()}
                          disabled={isFetchingRate}
                        >
                          <RefreshCw
                            className={`size-3.5 ${isFetchingRate ? "animate-spin" : ""}`}
                          />
                        </Button>
                      </div>
                    </div>
                    {isRateError && (
                      <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-2 text-xs text-destructive">
                        <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
                        <div className="flex-1 space-y-1">
                          <p className="font-medium">No se pudo obtener el tipo de cambio</p>
                          <p className="text-destructive/80">
                            {rateError ?? "Servicio de exchange no disponible."}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 mt-1"
                            onClick={() => invalidateRate()}
                            disabled={isFetchingRate}
                          >
                            <RefreshCw
                              className={`size-3 ${isFetchingRate ? "animate-spin" : ""}`}
                            />
                            Reintentar
                          </Button>
                        </div>
                      </div>
                    )}
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
                  disabled={
                    cartItems.length === 0 ||
                    isSelling ||
                    (needsConversion && (isRateError || exchangeRate <= 0))
                  }
                  onClick={handleConfirmSale}
                >
                  {isSelling ? "Procesando..." : "Confirmar Venta"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>

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
