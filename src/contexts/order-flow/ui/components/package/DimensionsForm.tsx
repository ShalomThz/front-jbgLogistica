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
import type { NewOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";
import { calculateVolumetricWeight, calculateBillableWeight } from "@contexts/order-flow/domain/services/packageCalculations";

export function DimensionsForm() {
  const { register, control, formState: { errors } } = useFormContext<NewOrderFormValues>();

  const pkg = useWatch<NewOrderFormValues, "package">({ name: "package" });

  return (
    <div className="space-y-4">
      {/* Dimensions */}
      <div className="grid grid-cols-4 gap-3">
        <div>
          <Label htmlFor="length">Largo *</Label>
          <Input
            id="length"
            aria-invalid={!!errors.package?.length}
            placeholder="0"
            {...register("package.length")}
          />
          {errors.package?.length && <p className="text-sm text-destructive">{errors.package.length.message}</p>}
        </div>
        <div>
          <Label htmlFor="width">Ancho *</Label>
          <Input
            id="width"
            aria-invalid={!!errors.package?.width}
            placeholder="0"
            {...register("package.width")}
          />
          {errors.package?.width && <p className="text-sm text-destructive">{errors.package.width.message}</p>}
        </div>
        <div>
          <Label htmlFor="height">Alto *</Label>
          <Input
            id="height"
            aria-invalid={!!errors.package?.height}
            placeholder="0"
            {...register("package.height")}
          />
          {errors.package?.height && <p className="text-sm text-destructive">{errors.package.height.message}</p>}
        </div>
        <div>
          <Label>Unidad</Label>
          <Controller
            control={control}
            name="package.dimensionUnit"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cm">cm</SelectItem>
                  <SelectItem value="in">in</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      {/* Weight */}
      <div>
        <Label htmlFor="weight">Peso *</Label>
        <div className="relative">
          <Input
            id="weight"
            aria-invalid={!!errors.package?.weight}
            placeholder="0"
            {...register("package.weight")}
            className="pr-8"
          />
          <span className="absolute right-2.5 top-2.5 text-sm text-muted-foreground">kg</span>
        </div>
        {errors.package?.weight && <p className="text-sm text-destructive">{errors.package.weight.message}</p>}
      </div>

      {/* Weight Calculations */}
      {(pkg.length && pkg.width && pkg.height) && (
        <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
          <h4 className="font-medium text-sm">Cálculo de las dimensiones</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Peso masa</div>
              <div className="font-medium">{pkg.weight || 0} kg</div>
            </div>
            <div>
              <div className="text-muted-foreground">Peso volumétrico</div>
              <div className="font-medium">{calculateVolumetricWeight(pkg).toFixed(2)} kg</div>
            </div>
            <div>
              <div className="text-muted-foreground">Peso a cotizar</div>
              <div className="font-medium">{calculateBillableWeight(pkg).toFixed(2)} kg</div>
            </div>
          </div>
        </div>
      )}

      {/* Quantity */}
      <div>
        <Label htmlFor="quantity">Cantidad de paquetes</Label>
        <Input
          id="quantity"
          type="number"
          min="1"
          {...register("package.quantity")}
        />
      </div>
    </div>
  );
}
