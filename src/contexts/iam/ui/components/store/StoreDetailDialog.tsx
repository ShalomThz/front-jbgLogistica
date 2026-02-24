import { Pencil, Trash2 } from "lucide-react";
import {
  Separator,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from "@contexts/shared/shadcn";
import type { StoreListViewPrimitives } from "@contexts/iam/domain/schemas/store/StoreListView";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="col-span-2 text-sm">{value}</span>
    </div>
  );
}

interface Props {
  store: StoreListViewPrimitives | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (store: StoreListViewPrimitives) => void;
  onDelete?: (store: StoreListViewPrimitives) => void;
}

export const StoreDetailDialog = ({
  store,
  open,
  onClose,
  onEdit,
  onDelete,
}: Props) => {
  if (!store) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg pt-8">
        <DialogHeader>
          <DialogTitle>{store.name}</DialogTitle>
          <DialogDescription>
            Creada el {new Date(store.createdAt).toLocaleDateString("es-MX")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Información</h4>
            <div className="rounded-md border p-3 space-y-1">
              <DetailRow label="Nombre" value={store.name} />
              <DetailRow label="Zona" value={store.zone.name} />
              <DetailRow label="Teléfono" value={store.phone} />
              <DetailRow label="Email" value={store.contactEmail} />
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Dirección</h4>
            <div className="rounded-md border p-3 space-y-1">
              <DetailRow label="Dirección" value={store.address.address1} />
              {store.address.address2 && (
                <DetailRow label="Dirección 2" value={store.address.address2} />
              )}
              <DetailRow label="Ciudad" value={store.address.city} />
              <DetailRow label="Estado" value={store.address.province} />
              <DetailRow label="C.P." value={store.address.zip} />
              <DetailRow label="País" value={store.address.country} />
              {store.address.reference && (
                <DetailRow label="Referencia" value={store.address.reference} />
              )}
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Fechas</h4>
            <div className="rounded-md border p-3 space-y-1">
              <DetailRow
                label="Creación"
                value={new Date(store.createdAt).toLocaleDateString("es-MX")}
              />
              <DetailRow
                label="Actualización"
                value={new Date(store.updatedAt).toLocaleDateString("es-MX")}
              />
            </div>
          </div>
        </div>
        {(onEdit || onDelete) && (
          <DialogFooter>
            {onDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(store)}
              >
                <Trash2 className="mr-1.5 size-4" />
                Eliminar
              </Button>
            )}
            {onEdit && (
              <Button size="sm" onClick={() => onEdit(store)}>
                <Pencil className="mr-1.5 size-4" />
                Editar
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
