import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@contexts/shared/shadcn";
import { PageLoader } from "@contexts/shared/ui/components/PageLoader";
import { parseApiError } from "@contexts/shared/infrastructure/http/errors";
import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { consolidationPolicies } from "@contexts/shared/domain/policies/consolidation.policy";
import { useTrailers } from "@contexts/consolidation/infrastructure/hooks/useTrailers";
import { useConsolidations } from "@contexts/consolidation/infrastructure/hooks/useConsolidations";
import type { TrailerListItem } from "@contexts/consolidation/domain/schemas/trailer/Trailer";
import { Container, Eye, Pencil, Plus, RefreshCw, Search, TriangleAlert, Truck } from "lucide-react";

interface FormState {
  unitNumber: string;
  type: string;
  plates: string;
  capacityLinearFeet: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  unitNumber: "",
  type: "",
  plates: "",
  capacityLinearFeet: "53",
  isActive: true,
};

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

/**
 * Catálogo de tráilers reales (unidades de flota): alta/edición simple, sin
 * máquina de estados de disponibilidad — el consolidado elige una unidad de
 * esta lista en vez de capturar tipo/unidad/placas como texto libre.
 */
const STATUS_FILTERS = ["all", "active", "inactive"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];
const STATUS_FILTER_LABELS: Record<StatusFilter, string> = {
  all: "Todos los estados",
  active: "Activos",
  inactive: "Inactivos",
};

export const TrailersPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canCreate = user ? consolidationPolicies.createTrailers(user) : false;
  const canEdit = user ? consolidationPolicies.editTrailers(user) : false;
  const canCreateConsolidation = user ? consolidationPolicies.create(user) : false;

  const { trailers, isLoading, refetch, createTrailer, isCreating, updateTrailer, isUpdating } =
    useTrailers();
  // Para calcular "Espacio ocupado": el consolidado activo (no CONCILIADO) de
  // cada unidad, si tiene uno — no es un campo propio del tráiler, se deriva
  // cruzando con la lista de consolidados que ya se pide en otras pantallas.
  const { consolidations } = useConsolidations({ limit: 100 });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TrailerListItem | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [viewing, setViewing] = useState<TrailerListItem | null>(null);

  const activeConsolidationByTrailer = useMemo(() => {
    const map = new Map<string, { totalLinearFeet: number }>();
    // Orden ascendente por creación: si por algún motivo una unidad quedara
    // con más de un consolidado abierto a la vez (no debería, el back no lo
    // impide todavía), se queda con el más reciente al sobrescribir al final.
    const sorted = [...consolidations].sort(
      (a, b) =>
        new Date(a.consolidation.createdAt).getTime() -
        new Date(b.consolidation.createdAt).getTime(),
    );
    for (const { consolidation, totalLinearFeet } of sorted) {
      if (!consolidation.trailerId || consolidation.stage === "CONCILIADO") continue;
      map.set(consolidation.trailerId, { totalLinearFeet });
    }
    return map;
  }, [consolidations]);

  const filteredTrailers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return trailers.filter((t) => {
      if (statusFilter === "active" && !t.isActive) return false;
      if (statusFilter === "inactive" && t.isActive) return false;
      if (!q) return true;
      return (
        t.unitNumber.toLowerCase().includes(q) || t.plates.toLowerCase().includes(q)
      );
    });
  }, [trailers, search, statusFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (trailer: TrailerListItem) => {
    setEditing(trailer);
    setForm({
      unitNumber: trailer.unitNumber,
      type: trailer.type,
      plates: trailer.plates,
      capacityLinearFeet: String(trailer.capacityLinearFeet),
      isActive: trailer.isActive,
    });
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    const payload = {
      unitNumber: form.unitNumber.trim(),
      type: form.type.trim(),
      plates: form.plates.trim(),
      capacityLinearFeet: Number(form.capacityLinearFeet),
      isActive: form.isActive,
    };
    try {
      if (editing) {
        await updateTrailer(editing.id, payload);
        toast.success("Tráiler actualizado");
      } else {
        await createTrailer(payload);
        toast.success("Tráiler creado");
      }
      setFormOpen(false);
    } catch (error) {
      toast.error(parseApiError(error));
    }
  };

  const formValid =
    !!form.unitNumber.trim() &&
    !!form.type.trim() &&
    !!form.plates.trim() &&
    Number(form.capacityLinearFeet) > 0;

  if (isLoading) return <PageLoader />;

  const activeCount = trailers.filter((t) => t.isActive).length;

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-muted p-2.5 text-primary">
            <Truck className="size-6" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Tráilers</h1>
            <p className="text-sm text-muted-foreground">
              Catálogo de unidades reales — {activeCount} activa
              {activeCount !== 1 ? "s" : ""} de {trailers.length}.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => refetch()}>
            <RefreshCw className="size-4" />
            Actualizar
          </Button>
          {canCreate && (
            <Button className="gap-2" onClick={openCreate}>
              <Plus className="size-4" />
              Nuevo tráiler
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar unidad o placas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((f) => (
              <SelectItem key={f} value={f}>
                {STATUS_FILTER_LABELS[f]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="min-h-0 flex-1">
        <CardContent className="h-full overflow-y-auto p-0">
          {filteredTrailers.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
              <Truck className="size-10 opacity-30" />
              <p className="text-sm font-medium">
                {trailers.length === 0
                  ? "No hay tráilers registrados"
                  : "Ningún tráiler coincide con la búsqueda"}
              </p>
              {canCreate && trailers.length === 0 && (
                <Button variant="outline" size="sm" className="mt-1 gap-1.5" onClick={openCreate}>
                  <Plus className="size-3.5" />
                  Crear el primero
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unidad</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Placas</TableHead>
                  <TableHead>Capacidad</TableHead>
                  <TableHead>Espacio ocupado</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrailers.map((t) => {
                  const active = activeConsolidationByTrailer.get(t.id);
                  const occupiedPct = active
                    ? Math.min(100, Math.round((active.totalLinearFeet / t.capacityLinearFeet) * 100))
                    : null;
                  return (
                    <TableRow key={t.id} className="cursor-pointer" onClick={() => setViewing(t)}>
                      <TableCell>
                        <button
                          type="button"
                          className="flex items-center gap-2 font-mono font-medium text-primary hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewing(t);
                          }}
                        >
                          <Truck className="size-4 shrink-0 text-muted-foreground" />
                          {t.unitNumber}
                        </button>
                      </TableCell>
                      <TableCell className="text-sm">{t.type}</TableCell>
                      <TableCell className="font-mono text-sm">{t.plates}</TableCell>
                      <TableCell className="text-sm">{t.capacityLinearFeet} ft</TableCell>
                      <TableCell className="min-w-36">
                        {active ? (
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">
                              {active.totalLinearFeet.toFixed(1)} / {t.capacityLinearFeet} ft ·{" "}
                              {occupiedPct}%
                            </p>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${occupiedPct}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sin consolidado activo</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={t.isActive ? "default" : "outline"}>
                          {t.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canCreateConsolidation && t.isActive && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/consolidations/new?trailerId=${t.id}`);
                              }}
                            >
                              <Container className="size-3.5" />
                              Crear consolidado
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewing(t);
                            }}
                          >
                            <Eye className="size-3.5" />
                          </Button>
                          {canEdit && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEdit(t);
                              }}
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!viewing} onOpenChange={(v) => !v && setViewing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="size-5 text-primary" />
              <span className="font-mono">{viewing?.unitNumber}</span>
            </DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-3">
              <Badge variant={viewing.isActive ? "default" : "outline"}>
                {viewing.isActive ? "Activo" : "Inactivo"}
              </Badge>
              <dl className="divide-y rounded-md border">
                <DetailRow label="Tipo" value={viewing.type} />
                <DetailRow label="Placas" value={viewing.plates} />
                <DetailRow label="Capacidad típica" value={`${viewing.capacityLinearFeet} ft lineales`} />
                <DetailRow label="Creado" value={formatDateTime(viewing.createdAt)} />
                <DetailRow label="Última actualización" value={formatDateTime(viewing.updatedAt)} />
              </dl>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewing(null)}>
              Cerrar
            </Button>
            {canEdit && viewing && (
              <Button
                className="gap-1.5"
                onClick={() => {
                  const trailer = viewing;
                  setViewing(null);
                  openEdit(trailer);
                }}
              >
                <Pencil className="size-3.5" />
                Editar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={formOpen} onOpenChange={(v) => !v && setFormOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar tráiler" : "Nuevo tráiler"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Un consolidado sellado guarda su propia copia del tráiler:
                editar aquí no la cambia, y conviene saberlo antes. */}
            {editing && editing.sealedInFolios.length > 0 && (
              <div className="flex gap-2 rounded-md border border-status-attention/40 bg-status-attention-soft p-3 text-xs">
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-status-attention-fg" />
                <div className="space-y-1">
                  <p className="font-medium">
                    Este tráiler ya va en {editing.sealedInFolios.length} consolidado
                    {editing.sealedInFolios.length === 1 ? " sellado" : "s sellados"}.
                  </p>
                  <p className="text-muted-foreground">
                    Esos embarques conservan la unidad, el tipo y las placas que tenía al
                    sellarse. Lo que cambies aquí solo aplica a consolidados abiertos y
                    futuros.
                  </p>
                  <p className="font-mono text-muted-foreground">
                    {editing.sealedInFolios.join(", ")}
                  </p>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="unitNumber">Unidad</Label>
              <Input
                id="unitNumber"
                placeholder="Ej. T-204"
                value={form.unitNumber}
                onChange={(e) => setForm((f) => ({ ...f, unitNumber: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Input
                  id="type"
                  placeholder="Tráiler 53'"
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plates">Placas</Label>
                <Input
                  id="plates"
                  value={form.plates}
                  onChange={(e) => setForm((f) => ({ ...f, plates: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacidad típica (pies lineales)</Label>
              <Input
                id="capacity"
                type="number"
                min={1}
                value={form.capacityLinearFeet}
                onChange={(e) =>
                  setForm((f) => ({ ...f, capacityLinearFeet: e.target.value }))
                }
              />
            </div>
            {editing && (
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <Label htmlFor="isActive">Activo</Label>
                  <p className="text-xs text-muted-foreground">
                    Los tráilers inactivos no aparecen para elegir en un consolidado nuevo.
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={form.isActive}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formValid || isCreating || isUpdating}
            >
              {isCreating || isUpdating ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
