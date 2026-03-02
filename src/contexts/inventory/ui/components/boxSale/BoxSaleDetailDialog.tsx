import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Separator,
} from "@contexts/shared/shadcn";
import type { BoxSalePrimitives } from "@contexts/inventory/domain/schemas/boxSale/BoxSale";

interface Props {
  sale: BoxSalePrimitives | null;
  open: boolean;
  onClose: () => void;
  boxNames?: Record<string, string>;
  userNames?: Record<string, string>;
}

export const BoxSaleDetailDialog = ({ sale, open, onClose, boxNames = {}, userNames = {} }: Props) => {
  if (!sale) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md pt-8">
        <DialogHeader>
          <DialogTitle>Detalle de Venta</DialogTitle>
          <DialogDescription>
            {new Date(sale.createdAt).toLocaleString("es-MX")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 gap-y-1 text-xs text-muted-foreground font-medium px-1">
            <span>Producto</span>
            <span className="text-right">P. Unit.</span>
            <span className="text-right">Subtotal</span>
          </div>
          <div className="space-y-2">
            {sale.items.map((item, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center rounded-md border p-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate">{boxNames[item.boxId] ?? item.boxId}</p>
                  <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                </div>
                <span className="font-mono text-right whitespace-nowrap">
                  ${item.unitPrice.amount.toFixed(2)}
                </span>
                <span className="font-mono text-right whitespace-nowrap">
                  ${item.subtotal.amount.toFixed(2)} {item.subtotal.currency}
                </span>
              </div>
            ))}
          </div>
        </div>
        <Separator />
        <div className="flex items-center justify-between font-semibold">
          <span>Total</span>
          <span className="font-mono text-lg">
            ${sale.totalAmount.amount.toFixed(2)} {sale.totalAmount.currency}
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          Vendido por: {userNames[sale.soldBy] ?? sale.soldBy}
        </div>
      </DialogContent>
    </Dialog>
  );
};
