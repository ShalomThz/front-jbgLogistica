import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@contexts/shared/shadcn";
import { cn } from "@contexts/shared/shadcn/lib/utils";
import { PageLoader } from "@contexts/shared/ui/components/PageLoader";
import { parseApiError } from "@contexts/shared/infrastructure/http/errors";
import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { consolidationPolicies } from "@contexts/shared/domain/policies/consolidation.policy";
import {
  consolidationStages,
  STAGE_LABELS,
  toneForStage,
} from "@contexts/consolidation/domain/schemas/consolidation/ConsolidationStages";
import { TONE_OUTLINE } from "@contexts/shared/domain/schemas/StatusTone";
import { useConsolidations } from "@contexts/consolidation/infrastructure/hooks/useConsolidations";
import { useConsolidationStats } from "@contexts/consolidation/infrastructure/hooks/useConsolidationStats";
import { useConsolidationFilters } from "@contexts/consolidation/ui/hooks/useConsolidationFilters";
import type { ConsolidationListItem } from "@contexts/consolidation/domain/schemas/consolidation/Consolidation";
import {
  Boxes,
  ChevronDown,
  Container,
  Eye,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Truck,
  TriangleAlert,
  Trash2,
} from "lucide-react";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type StageFilter = "all" | (typeof consolidationStages)[number];

const LIMIT = 20;

function QuickStat({
  label,
  value,
  icon: Icon,
  colorClass,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  colorClass: string;
}) {
  return (
    <Card className="py-0">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`rounded-lg p-2.5 ${colorClass}`}>
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export const ConsolidationsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canCreate = user ? consolidationPolicies.create(user) : false;
  const canView = user ? consolidationPolicies.view(user) : false;
  const canDelete = user ? consolidationPolicies.delete(user) : false;

  const [toDelete, setToDelete] = useState<ConsolidationListItem | null>(null);
  const [statsOpen, setStatsOpen] = useState(false);
  const [page, setPage] = useState(1);

  const { state: filterState, setFilter, criteria } = useConsolidationFilters();
  const hasFilters = filterState.searchQuery !== "" || filterState.stageFilter !== "all";

  // Otra búsqueda o etapa invalida la página actual. Se ajusta durante el
  // render (como en `DriversPage`): `criteria` está memoizado y sólo cambia
  // cuando cambian los filtros.
  const [lastCriteria, setLastCriteria] = useState(criteria);
  if (criteria !== lastCriteria) {
    setLastCriteria(criteria);
    setPage(1);
  }

  // Búsqueda, etapa y orden se resuelven en el back: el listado pagina.
  const {
    consolidations,
    pagination,
    totalPages,
    isLoading,
    error,
    refetch,
    deleteConsolidation,
    isDeleting,
  } = useConsolidations({ ...criteria, page, limit: LIMIT });
  const { stats } = useConsolidationStats();
  // Al eliminar el último de la última página, esa página deja de existir.
  if (pagination && page > Math.max(1, totalPages)) setPage(Math.max(1, totalPages));

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteConsolidation(toDelete.consolidation.id);
      toast.success("Consolidado eliminado");
      setToDelete(null);
    } catch (error) {
      toast.error(parseApiError(error));
    }
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-amber-50 p-2.5 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
            <Container className="size-6" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Consolidados</h1>
            <p className="text-sm text-muted-foreground">
              Embarques de tráiler: cajas, ruta y estado de cada consolidado enviado.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => refetch()}>
            <RefreshCw className="size-4" />
            Actualizar
          </Button>
          {canCreate && (
            <Button className="gap-2" onClick={() => navigate("/consolidations/new")}>
              <Plus className="size-4" />
              Nuevo consolidado
            </Button>
          )}
        </div>
      </div>

      {/* Métricas (colapsable) */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setStatsOpen((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronDown
            className={cn("size-3.5 transition-transform", !statsOpen && "-rotate-90")}
          />
          Métricas
        </button>
        {statsOpen && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <QuickStat
              label="En preparación"
              value={stats?.byStage.PREPARACION ?? 0}
              icon={Boxes}
              colorClass="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
            />
            <QuickStat
              label="En tránsito"
              value={stats?.byStage.EN_TRANSITO ?? 0}
              icon={Truck}
              colorClass="bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
            />
            <QuickStat
              label="Cajas cargadas"
              value={stats?.loadedOrders ?? 0}
              icon={Container}
              colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Buscar folio o ruta..."
          value={filterState.searchQuery}
          onChange={(e) => setFilter("searchQuery", e.target.value)}
          className="flex-1"
        />
        <Select
          value={filterState.stageFilter}
          onValueChange={(v) => setFilter("stageFilter", v as StageFilter)}
        >
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las etapas</SelectItem>
            {consolidationStages.map((s) => (
              <SelectItem key={s} value={s}>
                {STAGE_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="min-h-0 flex-1">
        <CardContent className="h-full overflow-y-auto p-0">
          {error ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <TriangleAlert className="size-10 text-destructive/60" />
              <p className="text-sm font-medium text-destructive">
                No se pudieron cargar los consolidados
              </p>
              <p className="max-w-sm text-xs text-muted-foreground">{error}</p>
              <Button variant="outline" size="sm" className="mt-1 gap-1.5" onClick={() => refetch()}>
                <RefreshCw className="size-3.5" />
                Reintentar
              </Button>
            </div>
          ) : consolidations.length === 0 && hasFilters ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
              <Container className="size-10 opacity-30" />
              <p className="text-sm font-medium">Ningún consolidado coincide con la búsqueda</p>
            </div>
          ) : consolidations.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
              <Container className="size-10 opacity-30" />
              <p className="text-sm font-medium">No hay consolidados registrados</p>
              {canCreate && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-1 gap-1.5"
                  onClick={() => navigate("/consolidations/new")}
                >
                  <Plus className="size-3.5" />
                  Crear el primero
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Folio</TableHead>
                  <TableHead>Ruta</TableHead>
                  <TableHead>Etapa</TableHead>
                  <TableHead>Cajas</TableHead>
                  <TableHead>Capacidad</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consolidations.map(({ consolidation: c, totalLinearFeet, isOverCapacity }) => {
                  const tone = toneForStage(c.stage);
                  const capacityPct = Math.min(
                    100,
                    Math.round((totalLinearFeet / c.capacityLinearFeet) * 100),
                  );
                  return (
                    <TableRow
                      key={c.id}
                      className={canView ? "cursor-pointer" : undefined}
                      onClick={canView ? () => navigate(`/consolidations/${c.id}`) : undefined}
                    >
                      <TableCell>
                        {canView ? (
                          <button
                            type="button"
                            className="font-mono font-medium text-primary hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/consolidations/${c.id}`);
                            }}
                          >
                            {c.folio}
                          </button>
                        ) : (
                          <span className="font-mono font-medium">{c.folio}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {c.origin.label} → {c.destination.label}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={TONE_OUTLINE[tone]}>
                          {STAGE_LABELS[c.stage]}
                        </Badge>
                      </TableCell>
                      <TableCell>{c.orders.length}</TableCell>
                      <TableCell className="min-w-36">
                        <p
                          className={`text-xs ${isOverCapacity ? "font-medium text-destructive" : "text-muted-foreground"}`}
                        >
                          {totalLinearFeet.toFixed(1)} / {c.capacityLinearFeet} ft · {capacityPct}%
                        </p>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full ${isOverCapacity ? "bg-destructive" : "bg-primary"}`}
                            style={{ width: `${capacityPct}%` }}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(c.createdAt)}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {canView && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5"
                              onClick={() => navigate(`/consolidations/${c.id}`)}
                            >
                              <Eye className="size-3.5" />
                              Ver
                            </Button>
                          )}
                          {/* Sólo antes de sellar: después es un embarque
                              real y el back lo rechaza. */}
                          {canDelete &&
                            (c.stage === "PREPARACION" || c.stage === "CARGANDO") && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="icon" variant="ghost" className="size-8">
                                  <MoreHorizontal className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() =>
                                    setToDelete({
                                      consolidation: c,
                                      driver: null,
                                      totalLinearFeet,
                                      isOverCapacity,
                                    })
                                  }
                                >
                                  <Trash2 className="mr-2 size-4" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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

      {pagination && pagination.total > LIMIT && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasMore}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      <Dialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Eliminar consolidado?</DialogTitle>
            <DialogDescription>
              Se eliminará permanentemente el consolidado{" "}
              <strong>{toDelete?.consolidation.folio}</strong>. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setToDelete(null)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
