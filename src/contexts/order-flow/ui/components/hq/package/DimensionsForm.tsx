import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@contexts/shared/shadcn";
import { useFormContext, useWatch, Controller } from "react-hook-form";
import type { HQOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";
import { PackagingSelector } from "./PackagingSelector";

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <p className="text-sm font-medium tabular-nums">{value || "—"}</p>
    </div>
  );
}

export function DimensionsForm() {
  const { register, control, formState: { errors } } = useFormContext<HQOrderFormValues>();
  const pkg = useWatch<HQOrderFormValues, "package">({ name: "package" });

  return (
    <div className="space-y-4">
      {/* Dimensions — always derived from the selected box */}
      <div className="rounded-md border bg-muted/30 px-3 py-2">
        <div className="grid grid-cols-4 gap-3">
          <ReadOnlyField label="Largo" value={pkg.length} />
          <ReadOnlyField label="Ancho" value={pkg.width} />
          <ReadOnlyField label="Alto" value={pkg.height} />
          <ReadOnlyField label="Unidad" value={pkg.dimensionUnit} />
        </div>
      </div>

      {/* Weight */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <Label htmlFor="weight">Peso *</Label>
          <Input
            id="weight"
            aria-invalid={!!errors.package?.weight}
            placeholder="0"
            {...register("package.weight")}
          />
          {errors.package?.weight && <p className="text-sm text-destructive">{errors.package.weight.message}</p>}
        </div>
        <div>
          <Label>Unidad</Label>
          <Controller
            control={control}
            name="package.weightUnit"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="lb">lb</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      {/* Packaging */}
      <PackagingSelector />
    </div>
  );
}
