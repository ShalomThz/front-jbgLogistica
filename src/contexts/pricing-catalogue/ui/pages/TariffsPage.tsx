import { useState } from "react";
import { Search } from "lucide-react";
import { Input, Badge, Table, TableHeader, TableBody, TableHead, TableRow, TableCell, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/shadcn";
import { TariffDetailDialog } from "../components/tariff/TariffDetailDialog";
import type { Tariff, TariffStatus } from "../components/tariff/TariffDetailDialog";

const STATUS_LABELS: Record<TariffStatus, string> = { ACTIVE: "Activa", INACTIVE: "Inactiva" };
const STATUS_VARIANT: Record<TariffStatus, "default" | "outline"> = { ACTIVE: "default", INACTIVE: "outline" };

const MOCK_DATA: Tariff[] = [
  { id: "TAR-001", name: "Estándar Local", zone: "Zona Centro", basePrice: 85.00, pricePerKg: 12.50, status: "ACTIVE", updatedAt: new Date("2025-01-20") },
  { id: "TAR-002", name: "Express Metropolitano", zone: "Zona Metropolitana", basePrice: 120.00, pricePerKg: 18.00, status: "ACTIVE", updatedAt: new Date("2025-01-22") },
  { id: "TAR-003", name: "Foráneo Norte", zone: "Zona Norte", basePrice: 200.00, pricePerKg: 25.00, status: "ACTIVE", updatedAt: new Date("2025-01-18") },
  { id: "TAR-004", name: "Foráneo Sur", zone: "Zona Sur", basePrice: 180.00, pricePerKg: 22.00, status: "INACTIVE", updatedAt: new Date("2025-01-15") },
  { id: "TAR-005", name: "Premium Nacional", zone: "Nacional", basePrice: 350.00, pricePerKg: 35.00, status: "ACTIVE", updatedAt: new Date("2025-01-25") },
];

export const TariffsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Tariff | null>(null);
  const filtered = MOCK_DATA.filter((t) => {
    const s = searchQuery === "" || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.zone.toLowerCase().includes(searchQuery.toLowerCase());
    return s && (statusFilter === "all" || t.status === statusFilter);
  });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Tarifas</h1>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1"><Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" /><Input placeholder="Buscar por nombre o zona..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" /></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Estado" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="ACTIVE">Activa</SelectItem><SelectItem value="INACTIVE">Inactiva</SelectItem></SelectContent></Select>
      </div>
      <div className="rounded-lg border">
        <Table><TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead className="hidden sm:table-cell">Zona</TableHead><TableHead className="text-right">Precio base</TableHead><TableHead className="text-right">$/Kg</TableHead><TableHead>Estado</TableHead><TableHead className="hidden lg:table-cell">Actualizado</TableHead></TableRow></TableHeader>
          <TableBody>{filtered.length === 0 ? (<TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No se encontraron tarifas.</TableCell></TableRow>) : filtered.map((t) => (
            <TableRow key={t.id} className="cursor-pointer" onClick={() => setSelected(t)}><TableCell className="font-medium">{t.name}</TableCell><TableCell className="hidden sm:table-cell">{t.zone}</TableCell><TableCell className="text-right font-mono">${t.basePrice.toFixed(2)}</TableCell><TableCell className="text-right font-mono">${t.pricePerKg.toFixed(2)}</TableCell><TableCell><Badge variant={STATUS_VARIANT[t.status]}>{STATUS_LABELS[t.status]}</Badge></TableCell><TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{t.updatedAt.toLocaleDateString("es-MX")}</TableCell></TableRow>
          ))}</TableBody></Table>
      </div>
      <TariffDetailDialog tariff={selected} open={!!selected} onClose={() => setSelected(null)} />
    </div>
  );
};
