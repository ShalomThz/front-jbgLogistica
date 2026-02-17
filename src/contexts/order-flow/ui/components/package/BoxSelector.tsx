import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@contexts/shared/shadcn";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { cn } from "@contexts/shared/shadcn/lib/utils";
import { useBoxes } from "@contexts/inventory/infrastructure/hooks/boxes/useBoxes";
import type { NewOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";

export function BoxSelector() {
  const { setValue, formState: { errors } } = useFormContext<NewOrderFormValues>();
  const [boxOpen, setBoxOpen] = useState(false);
  const { boxes, isLoading: isLoadingBoxes } = useBoxes({ limit: 100 });

  const boxId = useWatch<NewOrderFormValues, "package.boxId">({ name: "package.boxId" });
  const selectedBox = boxes.find((b) => b.id === boxId);

  return (
    <div>
      <Label>Caja *</Label>
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
              <span>
                {selectedBox.name} — {selectedBox.dimensions.length}x{selectedBox.dimensions.width}x{selectedBox.dimensions.height} {selectedBox.dimensions.unit}
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
                        {box.dimensions.length}x{box.dimensions.width}x{box.dimensions.height} {box.dimensions.unit} · Stock: {box.stock}
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
    </div>
  );
}
