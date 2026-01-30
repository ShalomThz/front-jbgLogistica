import { useState } from "react";
import { Search } from "lucide-react";
import { Input, Badge, Table, TableHeader, TableBody, TableHead, TableRow, TableCell, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/shadcn";
import { UserDetailDialog } from "../components/user/UserDetailDialog";
import type { User, UserStatus } from "../components/user/UserDetailDialog";

const STATUS_LABELS: Record<UserStatus, string> = { ACTIVE: "Activo", INACTIVE: "Inactivo" };
const STATUS_VARIANT: Record<UserStatus, "default" | "outline"> = { ACTIVE: "default", INACTIVE: "outline" };

const MOCK_DATA: User[] = [
  { id: "USR-001", name: "Carlos Mendoza", email: "carlos@jbg.com", role: "Administrador", store: "Sucursal Centro", status: "ACTIVE", createdAt: new Date("2023-01-15") },
  { id: "USR-002", name: "María López", email: "maria@jbg.com", role: "Vendedor", store: "Sucursal Polanco", status: "ACTIVE", createdAt: new Date("2023-06-20") },
  { id: "USR-003", name: "Juan Pérez", email: "juan@jbg.com", role: "Bodeguero", store: "Sucursal Centro", status: "INACTIVE", createdAt: new Date("2024-01-10") },
  { id: "USR-004", name: "Ana García", email: "ana@jbg.com", role: "Vendedor", store: "Sucursal Monterrey", status: "ACTIVE", createdAt: new Date("2024-03-20") },
  { id: "USR-005", name: "Roberto Sánchez", email: "roberto@jbg.com", role: "Conductor", store: "Sucursal Guadalajara", status: "ACTIVE", createdAt: new Date("2024-07-05") },
];

export const UsersPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<User | null>(null);
  const filtered = MOCK_DATA.filter((u) => {
    const s = searchQuery === "" || u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()) || u.role.toLowerCase().includes(searchQuery.toLowerCase());
    return s && (statusFilter === "all" || u.status === statusFilter);
  });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Usuarios</h1>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1"><Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" /><Input placeholder="Buscar por nombre, email o rol..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" /></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Estado" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="ACTIVE">Activo</SelectItem><SelectItem value="INACTIVE">Inactivo</SelectItem></SelectContent></Select>
      </div>
      <div className="rounded-lg border">
        <Table><TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead className="hidden sm:table-cell">Email</TableHead><TableHead>Rol</TableHead><TableHead className="hidden md:table-cell">Tienda</TableHead><TableHead>Estado</TableHead><TableHead className="hidden lg:table-cell">Registro</TableHead></TableRow></TableHeader>
          <TableBody>{filtered.length === 0 ? (<TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No se encontraron usuarios.</TableCell></TableRow>) : filtered.map((u) => (
            <TableRow key={u.id} className="cursor-pointer" onClick={() => setSelected(u)}><TableCell className="font-medium">{u.name}</TableCell><TableCell className="hidden sm:table-cell text-sm">{u.email}</TableCell><TableCell>{u.role}</TableCell><TableCell className="hidden md:table-cell text-sm">{u.store}</TableCell><TableCell><Badge variant={STATUS_VARIANT[u.status]}>{STATUS_LABELS[u.status]}</Badge></TableCell><TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{u.createdAt.toLocaleDateString("es-MX")}</TableCell></TableRow>
          ))}</TableBody></Table>
      </div>
      <UserDetailDialog user={selected} open={!!selected} onClose={() => setSelected(null)} />
    </div>
  );
};
