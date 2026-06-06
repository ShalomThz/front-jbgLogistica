import {
  Button,
  Label,
} from "@contexts/shared/shadcn";
import { Eraser, PackageX, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { useBoxes } from "@contexts/inventory/infrastructure/hooks/boxes/useBoxes";
import { BoxPickerCombobox } from "@contexts/inventory/ui/components/box/BoxPickerCombobox";
import { BoxStockDialog } from "@contexts/inventory/ui/components/box/BoxStockDialog";
import { BoxFormDialog } from "@contexts/inventory/ui/components/box/BoxFormDialog";
import { handleBoxError } from "@contexts/inventory/application/errors/handleBoxError";
import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { boxPolicies } from "@contexts/shared/domain/policies/box.policy";
import type { BaseOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";
import type { BoxPrimitives, CreateBoxRequestPrimitives } from "@contexts/inventory/domain/schemas/box/Box";

export function BoxSelector() {
  const { setValue, formState: { errors } } = useFormContext<BaseOrderFormValues>();
  const { user } = useAuth();
  const canListBoxes = user ? boxPolicies.list(user) : false;
  const canCreateBoxes = user ? boxPolicies.create(user) : false;
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { updateBox, isUpdating, createBox, isCreating } = useBoxes({ enabled: false });

  const boxId = useWatch<BaseOrderFormValues, "package.boxId">({ name: "package.boxId" });
  const ownership = useWatch<BaseOrderFormValues, "package.ownership">({ name: "package.ownership" });
  const packageType = useWatch<BaseOrderFormValues, "package.packageType">({ name: "package.packageType" });

  const selectedFilters = useMemo(
    () =>
      boxId
        ? [{ field: "id", filterOperator: "=" as const, value: boxId }]
        : [],
    [boxId],
  );

  const { boxes: selectedLookup } = useBoxes({
    filters: selectedFilters,
    enabled: !!boxId,
  });
  const selectedBox = selectedLookup[0] ?? null;

  const isStoreBox = ownership === "STORE";
  const outOfStock = isStoreBox && selectedBox?.stock === 0;

  const handleClear = () => {
    setValue("package.boxId", "", { shouldValidate: true });
    setValue("package.packageType", "");
    setValue("package.length", "");
    setValue("package.width", "");
    setValue("package.height", "");
    setValue("package.dimensionUnit", "in");
  };

  const handleSelectBox = (box: BoxPrimitives) => {
    setValue("package.boxId", box.id, { shouldValidate: true });
    setValue("package.packageType", box.name);
    setValue("package.length", box.dimensions.length.toString());
    setValue("package.width", box.dimensions.width.toString());
    setValue("package.height", box.dimensions.height.toString());
    setValue("package.dimensionUnit", box.dimensions.unit);
  };

  const handleCreateBox = async (data: CreateBoxRequestPrimitives) => {
    try {
      const created = await createBox(data);
      handleSelectBox(created);
      setCreateDialogOpen(false);
      toast.success(`Caja "${created.name}" creada`, { id: "order-flow" });
    } catch (error) {
      handleBoxError(error, { toastId: "order-flow" });
    }
  };

  const triggerLabel = (b: BoxPrimitives) => (
    <span className="flex items-center gap-2">
      {b.name} — {b.dimensions.length}x{b.dimensions.width}x{b.dimensions.height} {b.dimensions.unit}
      {isStoreBox && b.stock === 0 && (
        <span className="inline-flex items-center gap-1 rounded-full bg-destructive px-2 py-0.5 text-xs font-medium text-destructive-foreground">
          <PackageX className="size-3" />
          Sin stock
        </span>
      )}
    </span>
  );

  const itemLabel = (b: BoxPrimitives) => (
    <div>
      <div className="font-medium">{b.name}</div>
      <div className="text-xs text-muted-foreground">
        {b.dimensions.length}x{b.dimensions.width}x{b.dimensions.height} {b.dimensions.unit} ·{" "}
        <span className={isStoreBox && b.stock === 0 ? "text-destructive font-medium" : ""}>
          Stock: {b.stock}
        </span>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <Label>Caja *</Label>
        {boxId && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-destructive"
            onClick={handleClear}
          >
            <Eraser className="size-4" />
          </Button>
        )}
      </div>
      {canListBoxes ? (
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <BoxPickerCombobox
              value={boxId || undefined}
              onChange={handleSelectBox}
              placeholder="Buscar caja..."
              error={!!errors.package?.boxId}
              triggerLabel={triggerLabel}
              itemLabel={itemLabel}
            />
          </div>
          {canCreateBoxes ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setCreateDialogOpen(true)}
              title="Crear caja nueva"
            >
              <Plus className="size-4" />
            </Button>
          ) : (
            <p className="shrink-0 text-xs text-muted-foreground">
              No tienes permiso para crear cajas
            </p>
          )}
        </div>
      ) : (
        <div className="flex h-9 items-center rounded-md border bg-muted px-3 text-sm text-muted-foreground">
          No tienes permiso para ver cajas
        </div>
      )}
      {errors.package?.boxId && <p className="text-sm text-destructive">{errors.package.boxId.message}</p>}

      {outOfStock && (
        <div className="mt-2 flex items-center justify-between rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <span className="flex items-center gap-1.5">
            <PackageX className="size-4 shrink-0" />
            Esta caja no tiene stock disponible
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="ml-3 shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10"
            onClick={() => setStockDialogOpen(true)}
          >
            Agregar stock
          </Button>
        </div>
      )}

      <div className="space-y-1 mt-4">
        <Label className="text-xs text-muted-foreground">Nombre del paquete</Label>
        <p className="text-sm font-medium">
          {packageType || <span className="text-muted-foreground italic">Se rellena al seleccionar una caja</span>}
        </p>
      </div>

      <BoxStockDialog
        box={selectedBox}
        operation="add"
        open={stockDialogOpen}
        onClose={() => setStockDialogOpen(false)}
        onConfirm={async (boxId, newStock) => {
          await updateBox(boxId, { stock: newStock });
        }}
        isLoading={isUpdating}
      />

      <BoxFormDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSave={handleCreateBox}
        isLoading={isCreating}
      />
    </div>
  );
}
