import { useState } from "react";
import { Search } from "lucide-react";
import { Input, Badge, Table, TableHeader, TableBody, TableHead, TableRow, TableCell, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/shadcn";
import { StockDetailDialog } from "../components/stock/StockDetailDialog";
import type { StockItem, StockStatus } from "../components/stock/StockDetailDialog";

const STATUS_LABELS: Record<StockStatus, string> = { OK: "OK", LOW: "Bajo", OUT_OF_STOCK: "Agotado" };
const STATUS_VARIANT: Record<StockStatus, "default" | "outline" | "secondary"> = { OK: "default", LOW: "outline", OUT_OF_STOCK: "secondary" };

const MOCK_DATA: StockItem[] = [
  { id: "stk-001", product: "Audífonos Bluetooth Pro", warehouse: "Almacén Central", quantity: 45, minimum: 10, status: "OK", updatedAt: new Date("2025-01-20") },
  { id: "stk-002", product: "Camiseta Algodón Premium", warehouse: "Almacén Norte", quantity: 5, minimum: 20, status: "LOW", updatedAt: new Date("2025-01-22") },
  { id: "stk-003", product: "Café Orgánico 500g", warehouse: "Almacén Central", quantity: 0, minimum: 15, status: "OUT_OF_STOCK", updatedAt: new Date("2025-01-18") },
  { id: "stk-004", product: "Cargador Inalámbrico", warehouse: "Almacén Sur", quantity: 30, minimum: 10, status: "OK", updatedAt: new Date("2025-01-25") },
  { id: "stk-005", product: "Mochila Ejecutiva", warehouse: "Almacén Norte", quantity: 3, minimum: 8, status: "LOW", updatedAt: new Date("2025-01-23") },
];

export const StockPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<StockItem | null>(null);
  const filtered = MOCK_DATA.filter((i) => {
    const s = searchQuery === "" || i.product.toLowerCase().includes(searchQuery.toLowerCase()) || i.warehouse.toLowerCase().includes(searchQuery.toLowerCase());
    return s && (statusFilter === "all" || i.status === statusFilter);
  });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Inventario</h1>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1"><Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" /><Input placeholder="Buscar por producto o almacén..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" /></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Estado" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="OK">OK</SelectItem><SelectItem value="LOW">Bajo</SelectItem><SelectItem value="OUT_OF_STOCK">Agotado</SelectItem></SelectContent></Select>
      </div>
      <div className="rounded-lg border">
        <Table><TableHeader><TableRow><TableHead>Producto</TableHead><TableHead className="hidden sm:table-cell">Almacén</TableHead><TableHead className="text-right">Cantidad</TableHead><TableHead className="text-right">Mínimo</TableHead><TableHead>Estado</TableHead><TableHead className="hidden lg:table-cell">Actualizado</TableHead></TableRow></TableHeader>
          <TableBody>{filtered.length === 0 ? (<TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No se encontraron registros.</TableCell></TableRow>) : filtered.map((i) => (
            <TableRow key={i.id} className="cursor-pointer" onClick={() => setSelected(i)}><TableCell className="font-medium">{i.product}</TableCell><TableCell className="hidden sm:table-cell">{i.warehouse}</TableCell><TableCell className="text-right font-mono">{i.quantity}</TableCell><TableCell className="text-right font-mono">{i.minimum}</TableCell><TableCell><Badge variant={STATUS_VARIANT[i.status]}>{STATUS_LABELS[i.status]}</Badge></TableCell><TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{i.updatedAt.toLocaleDateString("es-MX")}</TableCell></TableRow>
          ))}</TableBody></Table>
      </div>
      <StockDetailDialog item={selected} open={!!selected} onClose={() => setSelected(null)} />
    </div>
  );
};
