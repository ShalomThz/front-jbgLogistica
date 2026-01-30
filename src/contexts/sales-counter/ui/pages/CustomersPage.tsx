import { useState } from "react";
import { Search } from "lucide-react";
import { Input, Badge, Table, TableHeader, TableBody, TableHead, TableRow, TableCell, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/shadcn";
import { CustomerDetailDialog } from "../components/CustomerDetailDialog";
import type { Customer, CustomerStatus } from "../components/CustomerDetailDialog";

const STATUS_LABELS: Record<CustomerStatus, string> = { ACTIVE: "Activo", INACTIVE: "Inactivo" };
const STATUS_VARIANT: Record<CustomerStatus, "default" | "outline"> = { ACTIVE: "default", INACTIVE: "outline" };

const MOCK_DATA: Customer[] = [
  { id: "cli-001", name: "Carlos Mendoza", phone: "5512345678", email: "carlos@email.com", totalOrders: 12, status: "ACTIVE", createdAt: new Date("2024-03-15") },
  { id: "cli-002", name: "María López", phone: "5587654321", email: "maria@email.com", totalOrders: 8, status: "ACTIVE", createdAt: new Date("2024-05-20") },
  { id: "cli-003", name: "Juan Pérez", phone: "5598765432", email: "juan@email.com", totalOrders: 3, status: "INACTIVE", createdAt: new Date("2024-01-10") },
  { id: "cli-004", name: "Ana García", phone: "5576543210", email: "ana@email.com", totalOrders: 15, status: "ACTIVE", createdAt: new Date("2023-11-05") },
  { id: "cli-005", name: "Roberto Sánchez", phone: "5565432109", email: "roberto@email.com", totalOrders: 1, status: "INACTIVE", createdAt: new Date("2024-08-22") },
];

export const CustomersPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Customer | null>(null);
  const filtered = MOCK_DATA.filter((c) => {
    const s = searchQuery === "" || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery) || c.email.toLowerCase().includes(searchQuery.toLowerCase());
    return s && (statusFilter === "all" || c.status === statusFilter);
  });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Clientes</h1>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1"><Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" /><Input placeholder="Buscar por nombre, teléfono o email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" /></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Estado" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="ACTIVE">Activo</SelectItem><SelectItem value="INACTIVE">Inactivo</SelectItem></SelectContent></Select>
      </div>
      <div className="rounded-lg border">
        <Table><TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead className="hidden sm:table-cell">Teléfono</TableHead><TableHead className="hidden md:table-cell">Email</TableHead><TableHead>Órdenes</TableHead><TableHead>Estado</TableHead><TableHead className="hidden lg:table-cell">Registro</TableHead></TableRow></TableHeader>
          <TableBody>{filtered.length === 0 ? (<TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No se encontraron clientes.</TableCell></TableRow>) : filtered.map((c) => (
            <TableRow key={c.id} className="cursor-pointer" onClick={() => setSelected(c)}><TableCell className="font-medium">{c.name}</TableCell><TableCell className="hidden sm:table-cell">{c.phone}</TableCell><TableCell className="hidden md:table-cell text-sm">{c.email}</TableCell><TableCell>{c.totalOrders}</TableCell><TableCell><Badge variant={STATUS_VARIANT[c.status]}>{STATUS_LABELS[c.status]}</Badge></TableCell><TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{c.createdAt.toLocaleDateString("es-MX")}</TableCell></TableRow>
          ))}</TableBody></Table>
      </div>
      <CustomerDetailDialog customer={selected} open={!!selected} onClose={() => setSelected(null)} />
    </div>
  );
};
