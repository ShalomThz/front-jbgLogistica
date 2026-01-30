import { useState } from "react";
import { Search } from "lucide-react";
import { Input, Badge, Table, TableHeader, TableBody, TableHead, TableRow, TableCell, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/shadcn";
import { StorageDetailDialog } from "../components/storage/StorageDetailDialog";
import type { StorageItem, StorageStatus } from "../components/storage/StorageDetailDialog";

const STATUS_LABELS: Record<StorageStatus, string> = { AVAILABLE: "Disponible", RESERVED: "Reservado", DISPATCHED: "Despachado" };
const STATUS_VARIANT: Record<StorageStatus, "default" | "secondary" | "outline"> = { AVAILABLE: "default", RESERVED: "secondary", DISPATCHED: "outline" };

const MOCK_DATA: StorageItem[] = [
  { id: "bod-001", code: "BOD-A1-001", product: "Cajas grandes", quantity: 150, location: "Pasillo A, Estante 1", status: "AVAILABLE", updatedAt: new Date("2025-01-20") },
  { id: "bod-002", code: "BOD-A2-002", product: "Sobres acolchados", quantity: 80, location: "Pasillo A, Estante 2", status: "RESERVED", updatedAt: new Date("2025-01-22") },
  { id: "bod-003", code: "BOD-B1-003", product: "Cajas medianas", quantity: 0, location: "Pasillo B, Estante 1", status: "DISPATCHED", updatedAt: new Date("2025-01-18") },
  { id: "bod-004", code: "BOD-B2-004", product: "Cinta embalaje", quantity: 200, location: "Pasillo B, Estante 2", status: "AVAILABLE", updatedAt: new Date("2025-01-25") },
  { id: "bod-005", code: "BOD-C1-005", product: "Etiquetas térmicas", quantity: 500, location: "Pasillo C, Estante 1", status: "RESERVED", updatedAt: new Date("2025-01-23") },
];

export const StoragePage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<StorageItem | null>(null);
  const filtered = MOCK_DATA.filter((i) => {
    const s = searchQuery === "" || i.code.toLowerCase().includes(searchQuery.toLowerCase()) || i.product.toLowerCase().includes(searchQuery.toLowerCase()) || i.location.toLowerCase().includes(searchQuery.toLowerCase());
    return s && (statusFilter === "all" || i.status === statusFilter);
  });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Bodega</h1>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1"><Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" /><Input placeholder="Buscar por código, producto o ubicación..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" /></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Estado" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="AVAILABLE">Disponible</SelectItem><SelectItem value="RESERVED">Reservado</SelectItem><SelectItem value="DISPATCHED">Despachado</SelectItem></SelectContent></Select>
      </div>
      <div className="rounded-lg border">
        <Table><TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Producto</TableHead><TableHead>Cantidad</TableHead><TableHead className="hidden sm:table-cell">Ubicación</TableHead><TableHead>Estado</TableHead><TableHead className="hidden lg:table-cell">Actualizado</TableHead></TableRow></TableHeader>
          <TableBody>{filtered.length === 0 ? (<TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No se encontraron registros.</TableCell></TableRow>) : filtered.map((i) => (
            <TableRow key={i.id} className="cursor-pointer" onClick={() => setSelected(i)}><TableCell className="font-mono text-xs">{i.code}</TableCell><TableCell className="font-medium">{i.product}</TableCell><TableCell>{i.quantity}</TableCell><TableCell className="hidden sm:table-cell text-sm">{i.location}</TableCell><TableCell><Badge variant={STATUS_VARIANT[i.status]}>{STATUS_LABELS[i.status]}</Badge></TableCell><TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{i.updatedAt.toLocaleDateString("es-MX")}</TableCell></TableRow>
          ))}</TableBody></Table>
      </div>
      <StorageDetailDialog item={selected} open={!!selected} onClose={() => setSelected(null)} />
    </div>
  );
};
