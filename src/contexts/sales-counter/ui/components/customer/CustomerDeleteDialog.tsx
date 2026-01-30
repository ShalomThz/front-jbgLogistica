import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Button } from "@/shared/shadcn";
import type { Customer } from "./CustomerDetailDialog";

interface Props {
  customer: Customer | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const CustomerDeleteDialog = ({ customer, open, onClose, onConfirm }: Props) => {
  if (!customer) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Eliminar cliente</DialogTitle>
          <DialogDescription>¿Eliminar a {customer.name}? Esta acción no se puede deshacer.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="destructive" onClick={onConfirm}>Eliminar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
