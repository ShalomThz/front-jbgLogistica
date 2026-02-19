import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@contexts/shared/shadcn";
import { useFormContext, Controller } from "react-hook-form";
import type { NewOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";

export function DimensionsForm() {
  const { register, control, formState: { errors } } = useFormContext<NewOrderFormValues>();

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
