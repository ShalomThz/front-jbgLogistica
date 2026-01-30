import { useState } from "react";
import { Search } from "lucide-react";
import { Input, Badge, Table, TableHeader, TableBody, TableHead, TableRow, TableCell, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/shadcn";
import { StoreDetailDialog } from "../components/StoreDetailDialog";
import type { Store, StoreStatus } from "../components/StoreDetailDialog";

const STATUS_LABELS: Record<StoreStatus, string> = { OPEN: "Abierta", CLOSED: "Cerrada", MAINTENANCE: "Mantenimiento" };
const STATUS_VARIANT: Record<StoreStatus, "default" | "outline" | "secondary"> = { OPEN: "default", CLOSED: "outline", MAINTENANCE: "secondary" };

const MOCK_DATA: Store[] = [
  { id: "TDA-001", name: "Sucursal Centro", address: "Av. Reforma 123, Col. Centro, CDMX", phone: "5551234567", manager: "Laura Martínez", status: "OPEN", createdAt: new Date("2023-01-15") },
  { id: "TDA-002", name: "Sucursal Polanco", address: "Av. Presidente Masaryk 456, Polanco, CDMX", phone: "5559876543", manager: "Pedro Ramírez", status: "OPEN", createdAt: new Date("2023-06-20") },
  { id: "TDA-003", name: "Sucursal Monterrey", address: "Av. Constitución 789, Centro, MTY", phone: "8181234567", manager: "Sofia Torres", status: "MAINTENANCE", createdAt: new Date("2024-02-10") },
  { id: "TDA-004", name: "Sucursal Guadalajara", address: "Av. Vallarta 321, Zapopan, GDL", phone: "3339876543", manager: "Diego Flores", status: "OPEN", createdAt: new Date("2024-05-01") },
  { id: "TDA-005", name: "Sucursal Puebla", address: "Blvd. 5 de Mayo 654, Centro, PUE", phone: "2221234567", manager: "Sin asignar", status: "CLOSED", createdAt: new Date("2024-08-15") },
];

export const StoresPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Store | null>(null);
  const filtered = MOCK_DATA.filter((s) => {
    const q = searchQuery === "" || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.address.toLowerCase().includes(searchQuery.toLowerCase()) || s.manager.toLowerCase().includes(searchQuery.toLowerCase());
    return q && (statusFilter === "all" || s.status === statusFilter);
  });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Tiendas</h1>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1"><Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" /><Input placeholder="Buscar por nombre, dirección o encargado..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" /></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Estado" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="OPEN">Abierta</SelectItem><SelectItem value="CLOSED">Cerrada</SelectItem><SelectItem value="MAINTENANCE">Mantenimiento</SelectItem></SelectContent></Select>
      </div>
      <div className="rounded-lg border">
        <Table><TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead className="hidden sm:table-cell">Dirección</TableHead><TableHead className="hidden md:table-cell">Teléfono</TableHead><TableHead className="hidden lg:table-cell">Encargado</TableHead><TableHead>Estado</TableHead><TableHead className="hidden lg:table-cell">Apertura</TableHead></TableRow></TableHeader>
          <TableBody>{filtered.length === 0 ? (<TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No se encontraron tiendas.</TableCell></TableRow>) : filtered.map((s) => (
            <TableRow key={s.id} className="cursor-pointer" onClick={() => setSelected(s)}><TableCell className="font-medium">{s.name}</TableCell><TableCell className="hidden sm:table-cell text-sm">{s.address}</TableCell><TableCell className="hidden md:table-cell">{s.phone}</TableCell><TableCell className="hidden lg:table-cell text-sm">{s.manager}</TableCell><TableCell><Badge variant={STATUS_VARIANT[s.status]}>{STATUS_LABELS[s.status]}</Badge></TableCell><TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{s.createdAt.toLocaleDateString("es-MX")}</TableCell></TableRow>
          ))}</TableBody></Table>
      </div>
      <StoreDetailDialog store={selected} open={!!selected} onClose={() => setSelected(null)} />
    </div>
  );
};
