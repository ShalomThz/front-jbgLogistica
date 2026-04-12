import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Separator,
  Badge,
} from "@contexts/shared/shadcn";
import { CheckCircle2, Printer } from "lucide-react";
import type { BoxSalePrimitives } from "@contexts/inventory/domain/schemas/boxSale/BoxSale";

interface StockInfo {
  boxId: string;
  name: string;
  dimensions: string;
  soldQuantity: number;
  previousStock: number;
  remainingStock: number;
}

interface Props {
  sale: BoxSalePrimitives | null;
  stockInfo: StockInfo[];
  open: boolean;
  onClose: () => void;
  onPrintReceipt?: (saleId: string) => void;
  isPrintingReceipt?: boolean;
}

export const BoxSaleSuccessDialog = ({
  sale,
  stockInfo,
  open,
  onClose,
  onPrintReceipt,
  isPrintingReceipt,
}: Props) => {
  if (!sale) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md pt-8">
        <DialogHeader className="items-center text-center">
          <CheckCircle2 className="size-12 text-green-500 mb-2" />
          <DialogTitle>Venta registrada</DialogTitle>
          <DialogDescription>
            {new Date(sale.createdAt).toLocaleString("es-MX")}
            {sale.customerName && (
              <>
                <br />
                Cliente: {sale.customerName}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-[50vh] overflow-y-auto">
          <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 gap-y-1 text-xs text-muted-foreground font-medium px-1">
            <span>Producto</span>
            <span className="text-right">Cant.</span>
            <span className="text-right">Subtotal</span>
          </div>
          <div className="space-y-2">
            {sale.items.map((item, i) => {
              const info = stockInfo.find((s) => s.boxId === item.boxId);
              return (
                <div
                  key={i}
                  className="rounded-md border p-2 text-sm space-y-1"
                >
                  <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center">
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {info?.name ?? item.boxId}
                      </p>
                      {info?.dimensions && (
                        <p className="text-xs text-muted-foreground">
                          {info.dimensions}
                        </p>
                      )}
                    </div>
                    <span className="text-right">x{item.quantity}</span>
                    <span className="font-mono text-right whitespace-nowrap">
                      ${item.subtotal.amount.toFixed(2)} {item.subtotal.currency}
                    </span>
                  </div>
                  {info && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Stock: {info.previousStock} → {info.remainingStock}</span>
                      {info.remainingStock === 0 && (
                        <Badge variant="destructive" className="text-[10px] px-1 py-0">
                          Agotado
                        </Badge>
                      )}
                      {info.remainingStock > 0 && info.remainingStock <= 5 && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0">
                          Bajo
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between font-semibold">
          <span>Total</span>
          <span className="font-mono text-lg">
            ${sale.totalAmount.amount.toFixed(2)} {sale.totalAmount.currency}
          </span>
        </div>

        <DialogFooter className="flex-row gap-2 sm:justify-between">
          {onPrintReceipt && (
            <Button
              variant="outline"
              onClick={() => onPrintReceipt(sale.id)}
              disabled={isPrintingReceipt}
            >
              <Printer className="mr-1.5 size-4" />
              {isPrintingReceipt ? "Preparando..." : "Imprimir recibo"}
            </Button>
          )}
          <Button onClick={onClose}>Continuar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
