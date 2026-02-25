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
import type { TariffListViewPrimitives } from "@contexts/pricing/domain/schemas/tariff/TariffListView";
import {
  createTariffRequestSchema,
  type CreateTariffRequestPrimitives,
} from "@contexts/pricing/domain/schemas/tariff/Tariff";
import { COUNTRIES } from "@contexts/shared/domain/schemas/address/Country";
import { useZones } from "@contexts/pricing/infrastructure/hooks/zones/useZones";
import { useBoxes } from "@contexts/inventory/infrastructure/hooks/boxes/useBoxes";

type FormInput = z.input<typeof createTariffRequestSchema>;

const CURRENCIES = ["MXN", "USD", "EUR"];

function getDefaults(tariff?: TariffListViewPrimitives | null): FormInput {
  return {
    originZoneId: tariff?.zone?.id ?? "",
    destinationCountry: tariff?.destinationCountry ?? "",
    boxId: tariff?.box?.id ?? "",
    price: {
      amount: tariff?.price.amount ?? 0,
      currency: tariff?.price.currency ?? "MXN",
    },
  };
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreateTariffRequestPrimitives) => void;
  tariff?: TariffListViewPrimitives | null;
  isLoading?: boolean;
}

export const TariffFormDialog = ({ open, onClose, onSave, tariff, isLoading }: Props) => {
  const { zones } = useZones({ page: 1, limit: 100 });
  const { boxes } = useBoxes();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormInput>({
    resolver: zodResolver(createTariffRequestSchema),
    defaultValues: getDefaults(tariff),
  });

  useEffect(() => {
    if (open) reset(getDefaults(tariff));
  }, [open, tariff, reset]);

  const onSubmit = handleSubmit((values) => onSave(values as CreateTariffRequestPrimitives));

  const isEdit = !!tariff;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Tarifa" : "Crear Tarifa"}</DialogTitle>
          <DialogDescription>{isEdit ? "Modifica los datos de la tarifa." : "Ingresa los datos de la nueva tarifa."}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label>Zona de origen</Label>
            <Controller
              name="originZoneId"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger aria-invalid={!!errors.originZoneId}>
                    <SelectValue placeholder="Seleccionar zona" />
                  </SelectTrigger>
                  <SelectContent>
                    {zones.map((z) => <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.originZoneId && (
              <p className="text-xs text-destructive">{errors.originZoneId.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>País de destino</Label>
            <Controller
              name="destinationCountry"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger aria-invalid={!!errors.destinationCountry}>
                    <SelectValue placeholder="Seleccionar país" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.destinationCountry && (
              <p className="text-xs text-destructive">{errors.destinationCountry.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Caja</Label>
            <Controller
              name="boxId"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger aria-invalid={!!errors.boxId}>
                    <SelectValue placeholder="Seleccionar caja" />
                  </SelectTrigger>
                  <SelectContent>
                    {boxes.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.boxId && (
              <p className="text-xs text-destructive">{errors.boxId.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="amount">Precio</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                aria-invalid={!!errors.price?.amount}
                {...register("price.amount", { valueAsNumber: true })}
              />
              {errors.price?.amount && (
                <p className="text-xs text-destructive">{errors.price.amount.message}</p>
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
                      {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.price?.currency && (
                <p className="text-xs text-destructive">{errors.price.currency.message}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>{isLoading ? "Guardando..." : "Guardar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
