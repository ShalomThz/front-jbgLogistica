import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@contexts/shared/shadcn";
import { Check, ChevronsUpDown, Eraser, Loader2, PackageX, Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { useFormContext, useWatch, Controller } from "react-hook-form";
import { cn } from "@contexts/shared/shadcn/lib/utils";
import { useBoxes } from "@contexts/inventory/infrastructure/hooks/boxes/useBoxes";
import { BoxStockDialog } from "@contexts/inventory/ui/components/box/BoxStockDialog";
import type { NewOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";

export function BoxSelector() {
  const { setValue, control, formState: { errors } } = useFormContext<NewOrderFormValues>();
  const [boxOpen, setBoxOpen] = useState(false);
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const { boxes, isLoading: isLoadingBoxes, updateBox, isUpdating } = useBoxes({ limit: 100 });

  const boxId = useWatch<NewOrderFormValues, "package.boxId">({ name: "package.boxId" });
  const packageType = useWatch<NewOrderFormValues, "package.packageType">({ name: "package.packageType" });
  const length = useWatch<NewOrderFormValues, "package.length">({ name: "package.length" });
  const width = useWatch<NewOrderFormValues, "package.width">({ name: "package.width" });
  const height = useWatch<NewOrderFormValues, "package.height">({ name: "package.height" });
  const dimensionUnit = useWatch<NewOrderFormValues, "package.dimensionUnit">({ name: "package.dimensionUnit" });
  const ownership = useWatch<NewOrderFormValues, "package.ownership">({ name: "package.ownership" });

  const selectedBox = boxes.find((b) => b.id === boxId);
  const isStoreBox = ownership === "STORE";
  const outOfStock = isStoreBox && selectedBox?.stock === 0;

  const nameChanged = selectedBox && packageType !== selectedBox.name;
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
      <Popover open={boxOpen} onOpenChange={setBoxOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={boxOpen}
            className="w-full justify-between font-normal"
          >
            {isLoadingBoxes ? (
              <span className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Cargando cajas...
              </span>
            ) : selectedBox ? (
              <span className="flex items-center gap-2">
                {selectedBox.name} — {selectedBox.dimensions.length}x{selectedBox.dimensions.width}x{selectedBox.dimensions.height} {selectedBox.dimensions.unit}
                {outOfStock && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-destructive px-2 py-0.5 text-xs font-medium text-destructive-foreground">
                    <PackageX className="size-3" />
                    Sin stock
                  </span>
                )}
              </span>
            ) : (
              <span className="text-muted-foreground">Buscar caja...</span>
            )}
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar por nombre..." />
            <CommandList>
              <CommandEmpty>No se encontraron cajas.</CommandEmpty>
              <CommandGroup>
                {boxes.map((box) => (
                  <CommandItem
                    key={box.id}
                    value={box.name}
                    onSelect={() => {
                      setValue("package.boxId", box.id, { shouldValidate: true });
                      setValue("package.packageType", box.name);
                      setValue("package.length", box.dimensions.length.toString());
                      setValue("package.width", box.dimensions.width.toString());
                      setValue("package.height", box.dimensions.height.toString());
                      setValue("package.dimensionUnit", box.dimensions.unit);
                      setBoxOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 size-4",
                        boxId === box.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div>
                      <div className="font-medium">{box.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {box.dimensions.length}x{box.dimensions.width}x{box.dimensions.height} {box.dimensions.unit} ·{" "}
                        <span className={isStoreBox && box.stock === 0 ? "text-destructive font-medium" : ""}>
                          Stock: {box.stock}
                        </span>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
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
        box={selectedBox ?? null}
        operation="add"
        open={stockDialogOpen}
        onClose={() => setStockDialogOpen(false)}
        onConfirm={(boxId, newStock) => updateBox(boxId, { stock: newStock })}
        isLoading={isUpdating}
      />
    </div>
  );
}
