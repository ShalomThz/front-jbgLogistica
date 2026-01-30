import { useState } from "react";
import { Search } from "lucide-react";
import { Input, Badge, Table, TableHeader, TableBody, TableHead, TableRow, TableCell, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/shadcn";
import { DeliveryRouteDetailDialog } from "../components/DeliveryRouteDetailDialog";
import type { DeliveryRoute, RouteStatus } from "../components/DeliveryRouteDetailDialog";

const STATUS_LABELS: Record<RouteStatus, string> = { ACTIVE: "Activa", INACTIVE: "Inactiva" };
const STATUS_VARIANT: Record<RouteStatus, "default" | "outline"> = { ACTIVE: "default", INACTIVE: "outline" };

const MOCK_DATA: DeliveryRoute[] = [
  { id: "RUT-001", name: "Centro Histórico", zone: "Zona Centro", stops: 15, driver: "Carlos Mendoza", status: "ACTIVE", updatedAt: new Date("2025-01-20") },
  { id: "RUT-002", name: "Zona Industrial Norte", zone: "Zona Norte", stops: 8, driver: "Roberto Sánchez", status: "ACTIVE", updatedAt: new Date("2025-01-22") },
  { id: "RUT-003", name: "Periférico Sur", zone: "Zona Sur", stops: 12, driver: "Sin asignar", status: "INACTIVE", updatedAt: new Date("2025-01-18") },
  { id: "RUT-004", name: "Corredor Reforma", zone: "Zona Centro", stops: 20, driver: "Ana García", status: "ACTIVE", updatedAt: new Date("2025-01-25") },
  { id: "RUT-005", name: "Parque Empresarial", zone: "Zona Poniente", stops: 6, driver: "Juan Pérez", status: "INACTIVE", updatedAt: new Date("2025-01-23") },
];

export const DeliveryRoutesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<DeliveryRoute | null>(null);
  const filtered = MOCK_DATA.filter((r) => {
    const s = searchQuery === "" || r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.zone.toLowerCase().includes(searchQuery.toLowerCase()) || r.driver.toLowerCase().includes(searchQuery.toLowerCase());
    return s && (statusFilter === "all" || r.status === statusFilter);
  });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Rutas de Entrega</h1>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1"><Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" /><Input placeholder="Buscar por nombre, zona o conductor..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" /></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Estado" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="ACTIVE">Activa</SelectItem><SelectItem value="INACTIVE">Inactiva</SelectItem></SelectContent></Select>
      </div>
      <div className="rounded-lg border">
        <Table><TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead className="hidden sm:table-cell">Zona</TableHead><TableHead className="text-right">Paradas</TableHead><TableHead className="hidden md:table-cell">Conductor</TableHead><TableHead>Estado</TableHead><TableHead className="hidden lg:table-cell">Actualizado</TableHead></TableRow></TableHeader>
          <TableBody>{filtered.length === 0 ? (<TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No se encontraron rutas.</TableCell></TableRow>) : filtered.map((r) => (
            <TableRow key={r.id} className="cursor-pointer" onClick={() => setSelected(r)}><TableCell className="font-medium">{r.name}</TableCell><TableCell className="hidden sm:table-cell">{r.zone}</TableCell><TableCell className="text-right font-mono">{r.stops}</TableCell><TableCell className="hidden md:table-cell text-sm">{r.driver}</TableCell><TableCell><Badge variant={STATUS_VARIANT[r.status]}>{STATUS_LABELS[r.status]}</Badge></TableCell><TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{r.updatedAt.toLocaleDateString("es-MX")}</TableCell></TableRow>
          ))}</TableBody></Table>
      </div>
      <DeliveryRouteDetailDialog route={selected} open={!!selected} onClose={() => setSelected(null)} />
    </div>
  );
};
