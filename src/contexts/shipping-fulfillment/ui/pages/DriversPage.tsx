import { useState } from "react";
import { Search } from "lucide-react";
import { Input, Badge, Table, TableHeader, TableBody, TableHead, TableRow, TableCell, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/shadcn";
import { DriverDetailDialog } from "../components/driver/DriverDetailDialog";
import type { Driver, DriverStatus } from "../components/driver/DriverDetailDialog";

const STATUS_LABELS: Record<DriverStatus, string> = { AVAILABLE: "Disponible", ON_ROUTE: "En ruta", OFF_DUTY: "Fuera de servicio" };
const STATUS_VARIANT: Record<DriverStatus, "default" | "secondary" | "outline"> = { AVAILABLE: "default", ON_ROUTE: "secondary", OFF_DUTY: "outline" };

const MOCK_DATA: Driver[] = [
  { id: "DRV-001", name: "Carlos Mendoza", phone: "5512345678", vehicle: "Ford Transit 2023", license: "LIC-A-12345", status: "AVAILABLE", hiredAt: new Date("2023-06-15") },
  { id: "DRV-002", name: "Roberto Sánchez", phone: "5565432109", vehicle: "Chevrolet Express 2022", license: "LIC-B-67890", status: "ON_ROUTE", hiredAt: new Date("2024-01-10") },
  { id: "DRV-003", name: "Ana García", phone: "5576543210", vehicle: "Mercedes Sprinter 2024", license: "LIC-A-11111", status: "AVAILABLE", hiredAt: new Date("2024-03-20") },
  { id: "DRV-004", name: "Juan Pérez", phone: "5598765432", vehicle: "Nissan NV200 2023", license: "LIC-B-22222", status: "OFF_DUTY", hiredAt: new Date("2023-09-01") },
  { id: "DRV-005", name: "María López", phone: "5587654321", vehicle: "Ford Transit 2024", license: "LIC-A-33333", status: "ON_ROUTE", hiredAt: new Date("2024-07-05") },
];

export const DriversPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Driver | null>(null);
  const filtered = MOCK_DATA.filter((d) => {
    const s = searchQuery === "" || d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.phone.includes(searchQuery) || d.vehicle.toLowerCase().includes(searchQuery.toLowerCase());
    return s && (statusFilter === "all" || d.status === statusFilter);
  });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Conductores</h1>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1"><Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" /><Input placeholder="Buscar por nombre, teléfono o vehículo..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" /></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Estado" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="AVAILABLE">Disponible</SelectItem><SelectItem value="ON_ROUTE">En ruta</SelectItem><SelectItem value="OFF_DUTY">Fuera de servicio</SelectItem></SelectContent></Select>
      </div>
      <div className="rounded-lg border">
        <Table><TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead className="hidden sm:table-cell">Teléfono</TableHead><TableHead className="hidden md:table-cell">Vehículo</TableHead><TableHead className="hidden lg:table-cell">Licencia</TableHead><TableHead>Estado</TableHead><TableHead className="hidden lg:table-cell">Ingreso</TableHead></TableRow></TableHeader>
          <TableBody>{filtered.length === 0 ? (<TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No se encontraron conductores.</TableCell></TableRow>) : filtered.map((d) => (
            <TableRow key={d.id} className="cursor-pointer" onClick={() => setSelected(d)}><TableCell className="font-medium">{d.name}</TableCell><TableCell className="hidden sm:table-cell">{d.phone}</TableCell><TableCell className="hidden md:table-cell text-sm">{d.vehicle}</TableCell><TableCell className="hidden lg:table-cell font-mono text-xs">{d.license}</TableCell><TableCell><Badge variant={STATUS_VARIANT[d.status]}>{STATUS_LABELS[d.status]}</Badge></TableCell><TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{d.hiredAt.toLocaleDateString("es-MX")}</TableCell></TableRow>
          ))}</TableBody></Table>
      </div>
      <DriverDetailDialog driver={selected} open={!!selected} onClose={() => setSelected(null)} />
    </div>
  );
};
