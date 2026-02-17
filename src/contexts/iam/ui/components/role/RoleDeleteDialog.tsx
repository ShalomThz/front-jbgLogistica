import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from "@contexts/shared/shadcn";
import type { UserRolePrimitives } from "@contexts/iam/domain/schemas/userRole/UserRole";

interface Props {
  role: UserRolePrimitives | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const RoleDeleteDialog = ({ role, open, onClose, onConfirm }: Props) => {
  if (!role) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Eliminar rol</DialogTitle>
          <DialogDescription>
            ¿Eliminar el rol <span className="font-medium">{role.name}</span>?
            Los usuarios con este rol perderán sus permisos asociados.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
