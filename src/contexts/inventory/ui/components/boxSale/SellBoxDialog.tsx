import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@contexts/shared/shadcn";
import type { BoxPrimitives } from "@contexts/inventory/domain/schemas/box/Box";

interface SellItem {
  box: BoxPrimitives;
  quantity: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  boxes: BoxPrimitives[];
  onConfirm: (items: { boxId: string; quantity: number }[]) => Promise<void>;
  isLoading?: boolean;
}

export const SellBoxDialog = ({ open, onClose, boxes, onConfirm, isLoading }: Props) => {
  const [quantities, setQuantities] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) setQuantities({});
  }, [open]);

  const availableBoxes = boxes.filter((b) => b.stock > 0);

  const items: SellItem[] = availableBoxes
    .map((box) => ({ box, quantity: Number(quantities[box.id]) || 0 }))
    .filter((i) => i.quantity > 0);

  const isValid = items.length > 0 && items.every((i) => i.quantity <= i.box.stock);

  const totalItems = items.reduce((acc, i) => acc + i.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    await onConfirm(items.map((i) => ({ boxId: i.box.id, quantity: i.quantity })));
    onClose();
  };

  const setQty = (boxId: string, value: string) => {
    setQuantities((prev) => ({ ...prev, [boxId]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="size-5" />
            Vender Cajas
          </DialogTitle>
          <DialogDescription>
            Ingresa la cantidad a vender por caja. Solo se incluyen cajas con stock disponible.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {availableBoxes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No hay cajas con stock disponible.
            </p>
          ) : (
            <div className="rounded-md border divide-y max-h-72 overflow-y-auto">
              {availableBoxes.map((box) => {
                const qty = Number(quantities[box.id]) || 0;
                const exceeds = qty > box.stock;
                return (
                  <div key={box.id} className="flex items-center justify-between gap-4 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{box.name}</p>
                      <p className="text-xs text-muted-foreground">Stock: {box.stock}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Label htmlFor={`qty-${box.id}`} className="sr-only">
                        Cantidad
                      </Label>
                      <Input
                        id={`qty-${box.id}`}
                        type="number"
                        min="0"
                        max={box.stock}
                        placeholder="0"
                        value={quantities[box.id] ?? ""}
                        onChange={(e) => setQty(box.id, e.target.value)}
                        className={`w-20 text-right ${exceeds ? "border-destructive" : ""}`}
                      />
                      {exceeds && (
                        <p className="text-xs text-destructive">Máx. {box.stock}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {items.length > 0 && (
            <div className="rounded-md bg-muted px-4 py-3 flex justify-between text-sm">
              <span className="text-muted-foreground">Total a vender</span>
              <span className="font-semibold">{totalItems} {totalItems === 1 ? "unidad" : "unidades"}</span>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!isValid || isLoading || availableBoxes.length === 0}>
              {isLoading ? "Procesando..." : "Confirmar venta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
