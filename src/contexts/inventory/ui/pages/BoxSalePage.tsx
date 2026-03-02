import { useState, useMemo } from "react";
import { Minus, Plus, Search, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
import { UNIT_SHORT_LABELS } from "../components/box/constants";
import type { BoxPrimitives } from "@contexts/inventory/domain/schemas/box/Box";

interface CartItem {
  box: BoxPrimitives;
  quantity: number;
}

export const BoxSalePage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<Map<string, CartItem>>(new Map());
  const [displayCurrency, setDisplayCurrency] = useState("MXN");
  const [exchangeRate, setExchangeRate] = useState(20);

  const { boxes, isLoading } = useBoxes();
  const { sellBox, isSelling } = useBoxSales({ enabled: false });
  const { user } = useAuth();

  const filtered = useMemo(
    () =>
      boxes.filter(
        (b) =>
          searchQuery === "" ||
          b.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
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

  const total = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) =>
          sum + convertPrice(item.box.price.amount, item.box.price.currency) * item.quantity,
        0,
      ),
    [cartItems, displayCurrency, exchangeRate],
  );

  const handleConfirmSale = async () => {
    if (!user || cartItems.length === 0) return;

    try {
      await sellBox({
        items: cartItems.map((item) => ({
          boxId: item.box.id,
          quantity: item.quantity,
        })),
        storeId: user.storeId,
        soldBy: user.id,
      });
      setCart(new Map());
      toast.success("Venta registrada exitosamente");
    } catch {
      toast.error("Error al registrar la venta");
    }
  };

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
    </div>
  );
};
