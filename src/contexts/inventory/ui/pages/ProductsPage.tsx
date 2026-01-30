import { useState } from "react";
import { Search } from "lucide-react";
import { Input, Badge, Table, TableHeader, TableBody, TableHead, TableRow, TableCell, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/shadcn";
import { ProductDetailDialog } from "../components/product/ProductDetailDialog";
import type { Product, ProductStatus, ProductCategory } from "../components/product/ProductDetailDialog";

const STATUS_LABELS: Record<ProductStatus, string> = { ACTIVE: "Activo", DISCONTINUED: "Descontinuado" };
const STATUS_VARIANT: Record<ProductStatus, "default" | "secondary"> = { ACTIVE: "default", DISCONTINUED: "secondary" };
const CATEGORY_LABELS: Record<ProductCategory, string> = { ELECTRONICS: "Electrónica", CLOTHING: "Ropa", FOOD: "Alimentos", OTHER: "Otros" };

const MOCK_DATA: Product[] = [
  { id: "prod-001", sku: "ELEC-1001", name: "Audífonos Bluetooth Pro", category: "ELECTRONICS", price: 899.99, stock: 45, status: "ACTIVE" },
  { id: "prod-002", sku: "CLOT-2001", name: "Camiseta Algodón Premium", category: "CLOTHING", price: 349.50, stock: 120, status: "ACTIVE" },
  { id: "prod-003", sku: "FOOD-3001", name: "Café Orgánico 500g", category: "FOOD", price: 189.00, stock: 0, status: "DISCONTINUED" },
  { id: "prod-004", sku: "ELEC-1002", name: "Cargador Inalámbrico", category: "ELECTRONICS", price: 450.00, stock: 30, status: "ACTIVE" },
  { id: "prod-005", sku: "OTHR-4001", name: "Mochila Ejecutiva", category: "OTHER", price: 1250.00, stock: 15, status: "ACTIVE" },
];

export const ProductsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Product | null>(null);
  const filtered = MOCK_DATA.filter((p) => {
    const s = searchQuery === "" || p.sku.toLowerCase().includes(searchQuery.toLowerCase()) || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return s && (statusFilter === "all" || p.status === statusFilter);
  });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Productos</h1>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1"><Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" /><Input placeholder="Buscar por SKU o nombre..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" /></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Estado" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="ACTIVE">Activo</SelectItem><SelectItem value="DISCONTINUED">Descontinuado</SelectItem></SelectContent></Select>
      </div>
      <div className="rounded-lg border">
        <Table><TableHeader><TableRow><TableHead>SKU</TableHead><TableHead>Nombre</TableHead><TableHead className="hidden sm:table-cell">Categoría</TableHead><TableHead className="text-right">Precio</TableHead><TableHead className="text-right">Stock</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
          <TableBody>{filtered.length === 0 ? (<TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No se encontraron productos.</TableCell></TableRow>) : filtered.map((p) => (
            <TableRow key={p.id} className="cursor-pointer" onClick={() => setSelected(p)}><TableCell className="font-mono text-xs">{p.sku}</TableCell><TableCell className="font-medium">{p.name}</TableCell><TableCell className="hidden sm:table-cell">{CATEGORY_LABELS[p.category]}</TableCell><TableCell className="text-right font-mono">${p.price.toFixed(2)}</TableCell><TableCell className="text-right font-mono">{p.stock}</TableCell><TableCell><Badge variant={STATUS_VARIANT[p.status]}>{STATUS_LABELS[p.status]}</Badge></TableCell></TableRow>
          ))}</TableBody></Table>
      </div>
      <ProductDetailDialog product={selected} open={!!selected} onClose={() => setSelected(null)} />
    </div>
  );
};
