import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@contexts/shared/shadcn";
import {
  createBoxRequestSchema,
  type BoxPrimitives,
  type CreateBoxRequestPrimitives,
} from "@contexts/inventory/domain/schemas/box/Box";
import { UNIT_LABELS } from "./constants";

type FormInput = z.input<typeof createBoxRequestSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreateBoxRequestPrimitives) => void;
  box?: BoxPrimitives | null;
  isLoading?: boolean;
}

function getDefaults(box?: BoxPrimitives | null): FormInput {
  return {
    name: box?.name ?? "",
    dimensions: {
      length: box?.dimensions.length ?? ("" as unknown as number),
      width: box?.dimensions.width ?? ("" as unknown as number),
      height: box?.dimensions.height ?? ("" as unknown as number),
      unit: box?.dimensions.unit ?? "cm",
    },
    stock: box?.stock ?? ("" as unknown as number),
    price: {
      amount: box?.price?.amount ?? ("" as unknown as number),
      currency: box?.price?.currency ?? "USD",
    },
  };
}

export const BoxFormDialog = ({
  open,
  onClose,
  onSave,
  box,
  isLoading,
}: Props) => {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormInput>({
    resolver: zodResolver(createBoxRequestSchema),
    defaultValues: getDefaults(box),
  });

  useEffect(() => {
    if (open) reset(getDefaults(box));
  }, [open, box, reset]);

  const onSubmit = handleSubmit((values) =>
    onSave(values as CreateBoxRequestPrimitives),
  );

  const isEdit = !!box;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Caja" : "Crear Caja"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modifica los datos de la caja."
              : "Ingresa los datos de la nueva caja."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              placeholder="Ej: Caja Pequeña"
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="length">Largo</Label>
              <Input
                id="length"
                type="number"
                aria-invalid={!!errors.dimensions?.length}
                {...register("dimensions.length", { valueAsNumber: true })}
              />
              {errors.dimensions?.length && (
                <p className="text-xs text-destructive">
                  {errors.dimensions.length.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="width">Ancho</Label>
              <Input
                id="width"
                type="number"
                aria-invalid={!!errors.dimensions?.width}
                {...register("dimensions.width", { valueAsNumber: true })}
              />
              {errors.dimensions?.width && (
                <p className="text-xs text-destructive">
                  {errors.dimensions.width.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Alto</Label>
              <Input
                id="height"
                type="number"
                aria-invalid={!!errors.dimensions?.height}
                {...register("dimensions.height", { valueAsNumber: true })}
              />
              {errors.dimensions?.height && (
                <p className="text-xs text-destructive">
                  {errors.dimensions.height.message}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Unidad</Label>
              <Controller
                name="dimensions.unit"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-invalid={!!errors.dimensions?.unit}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(UNIT_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.dimensions?.unit && (
                <p className="text-xs text-destructive">
                  {errors.dimensions.unit.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                aria-invalid={!!errors.stock}
                {...register("stock", { valueAsNumber: true })}
              />
              {errors.stock && (
                <p className="text-xs text-destructive">
                  {errors.stock.message}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="priceAmount">Precio</Label>
              <Input
                id="priceAmount"
                type="number"
                aria-invalid={!!errors.price?.amount}
                {...register("price.amount", { valueAsNumber: true })}
              />
              {errors.price?.amount && (
                <p className="text-xs text-destructive">
                  {errors.price.amount.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Moneda</Label>
              <Controller
                name="price.currency"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-invalid={!!errors.price?.currency}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="MXN">MXN</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.price?.currency && (
                <p className="text-xs text-destructive">
                  {errors.price.currency.message}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
