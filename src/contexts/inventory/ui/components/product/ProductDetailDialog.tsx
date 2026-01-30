import { Badge, Separator, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/shadcn";

export type ProductStatus = "ACTIVE" | "DISCONTINUED";
export type ProductCategory = "ELECTRONICS" | "CLOTHING" | "FOOD" | "OTHER";
export interface Product { id: string; sku: string; name: string; category: ProductCategory; price: number; stock: number; status: ProductStatus; }

const STATUS_LABELS: Record<ProductStatus, string> = { ACTIVE: "Activo", DISCONTINUED: "Descontinuado" };
const STATUS_VARIANT: Record<ProductStatus, "default" | "secondary"> = { ACTIVE: "default", DISCONTINUED: "secondary" };
const CATEGORY_LABELS: Record<ProductCategory, string> = { ELECTRONICS: "Electrónica", CLOTHING: "Ropa", FOOD: "Alimentos", OTHER: "Otros" };

function DetailRow({ label, value }: { label: string; value: string }) {
  return (<div className="grid grid-cols-3 gap-2"><span className="text-sm text-muted-foreground">{label}</span><span className="col-span-2 text-sm">{value}</span></div>);
}

interface Props { product: Product | null; open: boolean; onClose: () => void; }

export const ProductDetailDialog = ({ product, open, onClose }: Props) => {
  if (!product) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg pt-8">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between"><span>{product.name}</span><Badge variant={STATUS_VARIANT[product.status]}>{STATUS_LABELS[product.status]}</Badge></DialogTitle>
          <DialogDescription>SKU: {product.sku}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><h4 className="text-sm font-semibold">Producto</h4><div className="rounded-md border p-3 space-y-1"><DetailRow label="SKU" value={product.sku} /><DetailRow label="Nombre" value={product.name} /><DetailRow label="Categoría" value={CATEGORY_LABELS[product.category]} /></div></div>
          <Separator />
          <div className="space-y-2"><h4 className="text-sm font-semibold">Inventario</h4><div className="rounded-md border p-3 space-y-1"><DetailRow label="Precio" value={`$${product.price.toFixed(2)}`} /><DetailRow label="Stock" value={String(product.stock)} /><DetailRow label="Estado" value={STATUS_LABELS[product.status]} /></div></div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
