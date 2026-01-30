import { useState } from "react";
import { Search } from "lucide-react";
import { Input, Badge, Table, TableHeader, TableBody, TableHead, TableRow, TableCell, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/shadcn";
import { PurchaseDetailDialog } from "../components/purchase/PurchaseDetailDialog";
import type { Purchase, PurchaseStatus } from "../components/purchase/PurchaseDetailDialog";

const STATUS_LABELS: Record<PurchaseStatus, string> = { PENDING: "Pendiente", RECEIVED: "Recibida", CANCELLED: "Cancelada" };
const STATUS_VARIANT: Record<PurchaseStatus, "outline" | "default" | "secondary"> = { PENDING: "outline", RECEIVED: "default", CANCELLED: "secondary" };

const MOCK_DATA: Purchase[] = [
  { id: "PUR-001", supplier: "Distribuidora Nacional S.A.", total: 15200.00, items: 8, status: "RECEIVED", createdAt: new Date("2025-01-10") },
  { id: "PUR-002", supplier: "Tech Import MX", total: 32500.50, items: 12, status: "PENDING", createdAt: new Date("2025-01-18") },
  { id: "PUR-003", supplier: "Textiles del Bajío", total: 8750.00, items: 25, status: "RECEIVED", createdAt: new Date("2025-01-12") },
  { id: "PUR-004", supplier: "Alimentos Orgánicos Co.", total: 4300.75, items: 15, status: "CANCELLED", createdAt: new Date("2025-01-15") },
  { id: "PUR-005", supplier: "Tech Import MX", total: 18900.00, items: 6, status: "PENDING", createdAt: new Date("2025-01-25") },
];

export const PurchasesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Purchase | null>(null);
  const filtered = MOCK_DATA.filter((p) => {
    const s = searchQuery === "" || p.id.toLowerCase().includes(searchQuery.toLowerCase()) || p.supplier.toLowerCase().includes(searchQuery.toLowerCase());
    return s && (statusFilter === "all" || p.status === statusFilter);
  });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Compras</h1>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1"><Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" /><Input placeholder="Buscar por # compra o proveedor..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" /></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Estado" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="PENDING">Pendiente</SelectItem><SelectItem value="RECEIVED">Recibida</SelectItem><SelectItem value="CANCELLED">Cancelada</SelectItem></SelectContent></Select>
      </div>
      <div className="rounded-lg border">
        <Table><TableHeader><TableRow><TableHead># Compra</TableHead><TableHead>Proveedor</TableHead><TableHead className="text-right hidden sm:table-cell">Items</TableHead><TableHead className="text-right">Total</TableHead><TableHead>Estado</TableHead><TableHead className="hidden lg:table-cell">Fecha</TableHead></TableRow></TableHeader>
          <TableBody>{filtered.length === 0 ? (<TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No se encontraron compras.</TableCell></TableRow>) : filtered.map((p) => (
            <TableRow key={p.id} className="cursor-pointer" onClick={() => setSelected(p)}><TableCell className="font-mono text-xs">{p.id}</TableCell><TableCell className="font-medium">{p.supplier}</TableCell><TableCell className="text-right font-mono hidden sm:table-cell">{p.items}</TableCell><TableCell className="text-right font-mono">${p.total.toFixed(2)}</TableCell><TableCell><Badge variant={STATUS_VARIANT[p.status]}>{STATUS_LABELS[p.status]}</Badge></TableCell><TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{p.createdAt.toLocaleDateString("es-MX")}</TableCell></TableRow>
          ))}</TableBody></Table>
      </div>
      <PurchaseDetailDialog purchase={selected} open={!!selected} onClose={() => setSelected(null)} />
    </div>
  );
};
