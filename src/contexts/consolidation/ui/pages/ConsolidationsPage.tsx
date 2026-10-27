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
import {
  STAGE_LABELS,
  toneForStage,
} from "@contexts/consolidation/domain/schemas/consolidation/ConsolidationStages";
import { TONE_OUTLINE } from "@contexts/shared/domain/schemas/StatusTone";
import { useConsolidations } from "@contexts/consolidation/infrastructure/hooks/useConsolidations";
import type { ConsolidationListItem } from "@contexts/consolidation/domain/schemas/consolidation/Consolidation";
import { Container, Plus, RefreshCw, TriangleAlert, Trash2 } from "lucide-react";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export const ConsolidationsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canCreate = user ? consolidationPolicies.create(user) : false;
  const canDelete = user ? consolidationPolicies.delete(user) : false;

  const [toDelete, setToDelete] = useState<ConsolidationListItem | null>(null);

  const { consolidations, isLoading, error, refetch, deleteConsolidation, isDeleting } =
    useConsolidations({ limit: 100 });

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
                  return (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/consolidations/${c.id}`)}
                    >
                      <TableCell className="font-mono font-medium">{c.folio}</TableCell>
                      <TableCell className="text-sm">
                        {c.origin.label} → {c.destination.label}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={TONE_OUTLINE[tone]}>
                          {STAGE_LABELS[c.stage]}
                        </Badge>
                      </TableCell>
                      <TableCell>{c.orders.length}</TableCell>
                      <TableCell
                        className={isOverCapacity ? "font-medium text-destructive" : ""}
                      >
                        {totalLinearFeet.toFixed(1)} / {c.capacityLinearFeet} ft
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(c.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        {canDelete && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7 text-destructive hover:bg-destructive/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              setToDelete({ consolidation: c, driver: null, totalLinearFeet, isOverCapacity });
                            }}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
