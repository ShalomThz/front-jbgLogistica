import { useState } from "react";
import { Search } from "lucide-react";
import { Input, Badge, Table, TableHeader, TableBody, TableHead, TableRow, TableCell, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/shadcn";
import { ZoneDetailDialog } from "../components/zone/ZoneDetailDialog";
import type { Zone, ZoneStatus } from "../components/zone/ZoneDetailDialog";

const STATUS_LABELS: Record<ZoneStatus, string> = { ACTIVE: "Activa", INACTIVE: "Inactiva" };
const STATUS_VARIANT: Record<ZoneStatus, "default" | "outline"> = { ACTIVE: "default", INACTIVE: "outline" };

const MOCK_DATA: Zone[] = [
  { id: "ZON-001", name: "Zona Centro", code: "ZC-01", states: "CDMX, Estado de México", municipalities: 35, status: "ACTIVE", updatedAt: new Date("2025-01-20") },
  { id: "ZON-002", name: "Zona Norte", code: "ZN-01", states: "Nuevo León, Coahuila, Tamaulipas", municipalities: 45, status: "ACTIVE", updatedAt: new Date("2025-01-22") },
  { id: "ZON-003", name: "Zona Sur", code: "ZS-01", states: "Oaxaca, Chiapas, Guerrero", municipalities: 60, status: "INACTIVE", updatedAt: new Date("2025-01-18") },
  { id: "ZON-004", name: "Zona Poniente", code: "ZP-01", states: "Jalisco, Michoacán, Colima", municipalities: 40, status: "ACTIVE", updatedAt: new Date("2025-01-25") },
  { id: "ZON-005", name: "Zona Metropolitana", code: "ZM-01", states: "CDMX", municipalities: 16, status: "ACTIVE", updatedAt: new Date("2025-01-23") },
];

export const ZonesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Zone | null>(null);
  const filtered = MOCK_DATA.filter((z) => {
    const s = searchQuery === "" || z.name.toLowerCase().includes(searchQuery.toLowerCase()) || z.code.toLowerCase().includes(searchQuery.toLowerCase()) || z.states.toLowerCase().includes(searchQuery.toLowerCase());
    return s && (statusFilter === "all" || z.status === statusFilter);
  });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Zonas</h1>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1"><Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" /><Input placeholder="Buscar por nombre, código o estados..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" /></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Estado" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="ACTIVE">Activa</SelectItem><SelectItem value="INACTIVE">Inactiva</SelectItem></SelectContent></Select>
      </div>
      <div className="rounded-lg border">
        <Table><TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Código</TableHead><TableHead className="hidden sm:table-cell">Estados</TableHead><TableHead className="text-right">Municipios</TableHead><TableHead>Estado</TableHead><TableHead className="hidden lg:table-cell">Actualizado</TableHead></TableRow></TableHeader>
          <TableBody>{filtered.length === 0 ? (<TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No se encontraron zonas.</TableCell></TableRow>) : filtered.map((z) => (
            <TableRow key={z.id} className="cursor-pointer" onClick={() => setSelected(z)}><TableCell className="font-medium">{z.name}</TableCell><TableCell className="font-mono text-xs">{z.code}</TableCell><TableCell className="hidden sm:table-cell text-sm">{z.states}</TableCell><TableCell className="text-right font-mono">{z.municipalities}</TableCell><TableCell><Badge variant={STATUS_VARIANT[z.status]}>{STATUS_LABELS[z.status]}</Badge></TableCell><TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{z.updatedAt.toLocaleDateString("es-MX")}</TableCell></TableRow>
          ))}</TableBody></Table>
      </div>
      <ZoneDetailDialog zone={selected} open={!!selected} onClose={() => setSelected(null)} />
    </div>
  );
};
