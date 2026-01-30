import { useState } from "react";
import { Search } from "lucide-react";
import { Input, Badge, Table, TableHeader, TableBody, TableHead, TableRow, TableCell, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/shadcn";
import { RoleDetailDialog } from "../components/role/RoleDetailDialog";
import type { Role, RoleStatus } from "../components/role/RoleDetailDialog";

const STATUS_LABELS: Record<RoleStatus, string> = { ACTIVE: "Activo", INACTIVE: "Inactivo" };
const STATUS_VARIANT: Record<RoleStatus, "default" | "outline"> = { ACTIVE: "default", INACTIVE: "outline" };

const MOCK_DATA: Role[] = [
  { id: "ROL-001", name: "Administrador", description: "Acceso total al sistema", users: 2, permissions: 45, status: "ACTIVE", createdAt: new Date("2023-01-01") },
  { id: "ROL-002", name: "Vendedor", description: "Gestión de ventas y clientes", users: 8, permissions: 20, status: "ACTIVE", createdAt: new Date("2023-01-01") },
  { id: "ROL-003", name: "Bodeguero", description: "Gestión de inventario y bodega", users: 4, permissions: 15, status: "ACTIVE", createdAt: new Date("2023-03-15") },
  { id: "ROL-004", name: "Conductor", description: "Gestión de entregas y rutas", users: 5, permissions: 10, status: "ACTIVE", createdAt: new Date("2023-06-01") },
  { id: "ROL-005", name: "Auditor", description: "Solo lectura de reportes", users: 1, permissions: 8, status: "INACTIVE", createdAt: new Date("2024-01-10") },
];

export const RolesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Role | null>(null);
  const filtered = MOCK_DATA.filter((r) => {
    const s = searchQuery === "" || r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.description.toLowerCase().includes(searchQuery.toLowerCase());
    return s && (statusFilter === "all" || r.status === statusFilter);
  });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Roles</h1>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1"><Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" /><Input placeholder="Buscar por nombre o descripción..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" /></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Estado" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="ACTIVE">Activo</SelectItem><SelectItem value="INACTIVE">Inactivo</SelectItem></SelectContent></Select>
      </div>
      <div className="rounded-lg border">
        <Table><TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead className="hidden sm:table-cell">Descripción</TableHead><TableHead className="text-right">Usuarios</TableHead><TableHead className="text-right hidden md:table-cell">Permisos</TableHead><TableHead>Estado</TableHead><TableHead className="hidden lg:table-cell">Creado</TableHead></TableRow></TableHeader>
          <TableBody>{filtered.length === 0 ? (<TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No se encontraron roles.</TableCell></TableRow>) : filtered.map((r) => (
            <TableRow key={r.id} className="cursor-pointer" onClick={() => setSelected(r)}><TableCell className="font-medium">{r.name}</TableCell><TableCell className="hidden sm:table-cell text-sm">{r.description}</TableCell><TableCell className="text-right font-mono">{r.users}</TableCell><TableCell className="text-right font-mono hidden md:table-cell">{r.permissions}</TableCell><TableCell><Badge variant={STATUS_VARIANT[r.status]}>{STATUS_LABELS[r.status]}</Badge></TableCell><TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{r.createdAt.toLocaleDateString("es-MX")}</TableCell></TableRow>
          ))}</TableBody></Table>
      </div>
      <RoleDetailDialog role={selected} open={!!selected} onClose={() => setSelected(null)} />
    </div>
  );
};
