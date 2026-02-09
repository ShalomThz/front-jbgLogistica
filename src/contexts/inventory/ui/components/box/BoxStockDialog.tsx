import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Button, Input, Label } from "@/shared/shadcn";
import type { BoxPrimitives } from "../../../domain";

type StockOperation = "add" | "subtract";

interface Props {
  box: BoxPrimitives | null;
  operation: StockOperation | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (boxId: string, newStock: number) => void;
  isLoading?: boolean;
}

export const BoxStockDialog = ({ box, operation, open, onClose, onConfirm, isLoading }: Props) => {
  const [quantity, setQuantity] = useState("");

  useEffect(() => {
    if (open) setQuantity("");
  }, [open]);

  if (!box || !operation) return null;

  const isAdd = operation === "add";
  const currentStock = box.stock;
  const qty = Number(quantity) || 0;
  const newTotal = isAdd ? currentStock + qty : currentStock - qty;
  const isValid = qty > 0 && newTotal >= 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      onConfirm(box.id, newTotal);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isAdd ? <Plus className="size-5 text-green-600" /> : <Minus className="size-5 text-red-600" />}
            {isAdd ? "Agregar Stock" : "Descontar Stock"}
          </DialogTitle>
          <DialogDescription>{box.name}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-md border p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Stock actual</span>
              <span className="font-medium">{currentStock}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="quantity" className="text-sm text-muted-foreground">
                {isAdd ? "Cantidad a agregar" : "Cantidad a descontar"}
              </Label>
              <div className="flex items-center gap-2">
                <span className={isAdd ? "text-green-600" : "text-red-600"}>{isAdd ? "+" : "−"}</span>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max={isAdd ? undefined : currentStock}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-24 text-right"
                  autoFocus
                  required
                />
              </div>
            </div>
            <div className="border-t pt-3 flex justify-between">
              <span className="text-sm font-medium">Total resultante</span>
              <span className={`font-bold ${newTotal < 0 ? "text-red-600" : ""}`}>{newTotal}</span>
            </div>
          </div>
          {!isAdd && qty > currentStock && (
            <p className="text-sm text-red-600">No puedes descontar más del stock disponible.</p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
            <Button type="submit" disabled={!isValid || isLoading} variant={isAdd ? "default" : "destructive"}>
              {isLoading ? "Procesando..." : isAdd ? "Agregar" : "Descontar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
