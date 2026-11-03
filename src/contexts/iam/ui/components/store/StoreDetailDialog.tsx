import { FileText, Pencil, Tag, Trash2 } from "lucide-react";
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
  onEditInvoice?: (store: StoreListViewPrimitives) => void;
  onEditLabel?: (store: StoreListViewPrimitives) => void;
  onDelete?: (store: StoreListViewPrimitives) => void;
}

export const StoreDetailDialog = ({
  store,
  open,
  onClose,
  onEdit,
  onEditInvoice,
  onEditLabel,
  onDelete,
}: Props) => {
  if (!store) return null;

  const invoicePrimary = store.invoiceBranding?.primaryColor || "#15295C";
  const invoiceAccent = store.invoiceBranding?.accentColor || "#C62433";
  const labelBanner = store.agentLabelBranding?.primaryColor || "#2B5C8F";
  const labelCp = store.agentLabelBranding?.secondaryColor || "#333333";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto pt-8">
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
              <DetailRow label="Tipo" value={store.type === "PARTNER" ? "Socio" : "Distribuidora JBG"} />
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
            <h4 className="text-sm font-semibold">Personalización</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Factura */}
              <div className="rounded-md border p-3 space-y-2 bg-muted/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold flex items-center gap-1.5">
                    <FileText className="size-3.5 text-primary" /> Factura
                  </span>
                  {onEditInvoice && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => onEditInvoice(store)}
                    >
                      Personalizar
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Logo:</span>
                  <span className="font-medium text-foreground">
                    {store.invoiceBranding?.logo ? "Personalizado" : "JBG"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="size-4 rounded-full border shadow-xs"
                    style={{ backgroundColor: invoicePrimary }}
                    title={`Principal: ${invoicePrimary}`}
                  />
                  <div
                    className="size-4 rounded-full border shadow-xs"
                    style={{ backgroundColor: invoiceAccent }}
                    title={`Acento: ${invoiceAccent}`}
                  />
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {invoicePrimary} · {invoiceAccent}
                  </span>
                </div>
              </div>

              {/* Etiqueta */}
              <div className="rounded-md border p-3 space-y-2 bg-muted/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold flex items-center gap-1.5">
                    <Tag className="size-3.5 text-primary" /> Etiqueta
                  </span>
                  {onEditLabel && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => onEditLabel(store)}
                    >
                      Personalizar
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Logo:</span>
                  <span className="font-medium text-foreground">
                    {store.agentLabelBranding?.logo ? "Personalizado" : "JBG"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="size-4 rounded-full border shadow-xs"
                    style={{ backgroundColor: labelBanner }}
                    title={`Banner: ${labelBanner}`}
                  />
                  <div
                    className="size-4 rounded-full border shadow-xs"
                    style={{ backgroundColor: labelCp }}
                    title={`C.P.: ${labelCp}`}
                  />
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {labelBanner} · {labelCp}
                  </span>
                </div>
              </div>
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
        <DialogFooter className="gap-2 sm:gap-1 flex-wrap">
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
          {onEditInvoice && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditInvoice(store)}
            >
              <FileText className="mr-1.5 size-4" />
              Editar Factura
            </Button>
          )}
          {onEditLabel && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditLabel(store)}
            >
              <Tag className="mr-1.5 size-4" />
              Editar Etiqueta
            </Button>
          )}
          {onEdit && (
            <Button size="sm" onClick={() => onEdit(store)}>
              <Pencil className="mr-1.5 size-4" />
              Editar Tienda
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
