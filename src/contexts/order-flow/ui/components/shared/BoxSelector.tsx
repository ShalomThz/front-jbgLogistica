import {
  Button,
  Input,
  Label,
} from "@contexts/shared/shadcn";
import { Eraser, PackageX, Pencil, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useFormContext, useWatch, Controller } from "react-hook-form";
import { useBoxes } from "@contexts/inventory/infrastructure/hooks/boxes/useBoxes";
import { BoxPickerCombobox } from "@contexts/inventory/ui/components/box/BoxPickerCombobox";
import { BoxStockDialog } from "@contexts/inventory/ui/components/box/BoxStockDialog";
import type { BaseOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";
import type { BoxPrimitives } from "@contexts/inventory/domain/schemas/box/Box";

export function BoxSelector() {
  const { setValue, control, formState: { errors } } = useFormContext<BaseOrderFormValues>();
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const { updateBox, isUpdating } = useBoxes({ enabled: false });

  const boxId = useWatch<BaseOrderFormValues, "package.boxId">({ name: "package.boxId" });
  const packageType = useWatch<BaseOrderFormValues, "package.packageType">({ name: "package.packageType" });
  const length = useWatch<BaseOrderFormValues, "package.length">({ name: "package.length" });
  const width = useWatch<BaseOrderFormValues, "package.width">({ name: "package.width" });
  const height = useWatch<BaseOrderFormValues, "package.height">({ name: "package.height" });
  const dimensionUnit = useWatch<BaseOrderFormValues, "package.dimensionUnit">({ name: "package.dimensionUnit" });
  const ownership = useWatch<BaseOrderFormValues, "package.ownership">({ name: "package.ownership" });

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

  const nameChanged = selectedBox && packageType && packageType !== selectedBox.name;
  const dimensionsChanged = selectedBox && (
    parseFloat(length) !== selectedBox.dimensions.length ||
    parseFloat(width) !== selectedBox.dimensions.width ||
    parseFloat(height) !== selectedBox.dimensions.height ||
    dimensionUnit !== selectedBox.dimensions.unit
  );
  const hasChanges = nameChanged || dimensionsChanged;

  const hasData = packageType || length || width || height;

  const statusMessage = !boxId && hasData
    ? { text: "Se creará una nueva caja al continuar", icon: Plus }
    : boxId && hasChanges
      ? { text: "Se actualizará esta caja al continuar", icon: Pencil }
      : null;

  const handleClear = () => {
    setValue("package.boxId", null, { shouldValidate: true });
    setValue("package.packageType", "");
    setValue("package.length", "");
    setValue("package.width", "");
    setValue("package.height", "");
    setValue("package.dimensionUnit", "cm");
  };

  const handleSelectBox = (box: BoxPrimitives) => {
    setValue("package.boxId", box.id, { shouldValidate: true });
    setValue("package.packageType", box.name);
    setValue("package.length", box.dimensions.length.toString());
    setValue("package.width", box.dimensions.width.toString());
    setValue("package.height", box.dimensions.height.toString());
    setValue("package.dimensionUnit", box.dimensions.unit);
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
      <BoxPickerCombobox
        value={boxId ?? undefined}
        onChange={handleSelectBox}
        placeholder="Buscar caja..."
        error={!!errors.package?.boxId}
        triggerLabel={triggerLabel}
        itemLabel={itemLabel}
      />
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
        <Label htmlFor="package-name">Nombre del paquete</Label>
        <Controller
          control={control}
          name="package.packageType"
          render={({ field }) => (
            <Input
              id="package-name"
              placeholder="Se rellena al seleccionar una caja"
              {...field}
            />
          )}
        />
      </div>

      {statusMessage && (
        <p className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
          <statusMessage.icon className="size-3 shrink-0" />
          {statusMessage.text}
        </p>
      )}

      <BoxStockDialog
        box={selectedBox}
        operation="add"
        open={stockDialogOpen}
        onClose={() => setStockDialogOpen(false)}
        onConfirm={(boxId, newStock) => updateBox(boxId, { stock: newStock })}
        isLoading={isUpdating}
      />
    </div>
  );
}
