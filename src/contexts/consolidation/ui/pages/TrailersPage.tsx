import { useState } from "react";
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
import type { TrailerPrimitives } from "@contexts/consolidation/domain/schemas/trailer/Trailer";
import { Pencil, Plus, RefreshCw, Truck } from "lucide-react";

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

/**
 * Catálogo de tráilers reales (unidades de flota): alta/edición simple, sin
 * máquina de estados de disponibilidad — el consolidado elige una unidad de
 * esta lista en vez de capturar tipo/unidad/placas como texto libre.
 */
export const TrailersPage = () => {
  const { user } = useAuth();
  const canCreate = user ? consolidationPolicies.createTrailers(user) : false;
  const canEdit = user ? consolidationPolicies.editTrailers(user) : false;

  const { trailers, isLoading, refetch, createTrailer, isCreating, updateTrailer, isUpdating } =
    useTrailers();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TrailerPrimitives | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (trailer: TrailerPrimitives) => {
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

      <Card className="min-h-0 flex-1">
        <CardContent className="h-full overflow-y-auto p-0">
          {trailers.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
              <Truck className="size-10 opacity-30" />
              <p className="text-sm font-medium">No hay tráilers registrados</p>
              {canCreate && (
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
                  <TableHead>Estado</TableHead>
                  {canEdit && <TableHead className="text-right">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {trailers.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono font-medium">{t.unitNumber}</TableCell>
                    <TableCell className="text-sm">{t.type}</TableCell>
                    <TableCell className="font-mono text-sm">{t.plates}</TableCell>
                    <TableCell className="text-sm">{t.capacityLinearFeet} ft</TableCell>
                    <TableCell>
                      <Badge variant={t.isActive ? "default" : "outline"}>
                        {t.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(t)}>
                          <Pencil className="size-3.5" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={(v) => !v && setFormOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar tráiler" : "Nuevo tráiler"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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
