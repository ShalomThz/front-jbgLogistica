import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Button } from "@contexts/shared/shadcn";
import type { CustomerListViewPrimitives } from "@contexts/sales/domain/schemas/customer/CustomerListView";

interface Props {
  customer: CustomerListViewPrimitives | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const CustomerDeleteDialog = ({ customer, open, onClose, onConfirm, isLoading }: Props) => {
  if (!customer) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Eliminar cliente</DialogTitle>
          <DialogDescription>
            ¿Eliminar a <span className="font-medium">{customer.name}</span> de{" "}
            <span className="font-medium">{customer.company}</span>? Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isLoading}>{isLoading ? "Eliminando..." : "Eliminar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
