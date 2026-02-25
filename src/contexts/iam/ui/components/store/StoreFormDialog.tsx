import { useEffect } from "react";
import { useForm, Controller, FormProvider } from "react-hook-form";
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
import { AddressSection } from "@contexts/shared/ui/components/address/AddressSection";
import type { StoreListViewPrimitives } from "@contexts/iam/domain/schemas/store/StoreListView";
import {
  createStoreRequestSchema,
  type CreateStoreRequestPrimitives,
} from "@contexts/iam/application/store/CreateStoreRequest";
import { useZones } from "@contexts/pricing/infrastructure/hooks/zones/useZones";

type FormInput = z.input<typeof createStoreRequestSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreateStoreRequestPrimitives) => void;
  store?: StoreListViewPrimitives | null;
  isLoading?: boolean;
}

function getDefaults(store?: StoreListViewPrimitives | null): CreateStoreRequestPrimitives {
  return {
    name: store?.name ?? "",
    zoneId: store?.zone.id ?? "",
    phone: store?.phone ?? "",
    contactEmail: store?.contactEmail ?? "",
    address: {
      address1: store?.address.address1 ?? "",
      address2: store?.address.address2 ?? "",
      city: store?.address.city ?? "",
      province: store?.address.province ?? "",
      zip: store?.address.zip ?? "",
      country: store?.address.country ?? "MX",
      reference: store?.address.reference ?? "",
      geolocation: store?.address.geolocation ?? {
        latitude: 0,
        longitude: 0,
        placeId: null,
      },
    },
  };
}

export const StoreFormDialog = ({
  open,
  onClose,
  onSave,
  store,
  isLoading,
}: Props) => {
  const { zones, isLoading: isLoadingZones } = useZones();

  const form = useForm<FormInput>({
    resolver: zodResolver(createStoreRequestSchema),
    defaultValues: getDefaults(store),
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (open) reset(getDefaults(store));
  }, [open, store, reset]);

  const onSubmit = handleSubmit((values) => onSave(values as CreateStoreRequestPrimitives));

  const isEdit = !!store;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Tienda" : "Crear Tienda"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Modifica los datos de la tienda."
              : "Ingresa los datos de la nueva tienda."}
          </DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={onSubmit} noValidate className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                placeholder="Ej: Sucursal Centro"
                aria-invalid={!!errors.name}
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Zona</Label>
                <Controller
                  name="zoneId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isLoadingZones}
                    >
                      <SelectTrigger aria-invalid={!!errors.zoneId}>
                        <SelectValue
                          placeholder={isLoadingZones ? "Cargando..." : "Seleccionar zona"}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {zones.map((z) => (
                          <SelectItem key={z.id} value={z.id}>
                            {z.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.zoneId && (
                  <p className="text-xs text-destructive">{errors.zoneId.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  placeholder="5512345678"
                  aria-invalid={!!errors.phone}
                  {...register("phone")}
                />
                {errors.phone && (
                  <p className="text-xs text-destructive">{errors.phone.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Email de contacto</Label>
              <Input
                id="contactEmail"
                type="email"
                placeholder="tienda@ejemplo.com"
                aria-invalid={!!errors.contactEmail}
                {...register("contactEmail")}
              />
              {errors.contactEmail && (
                <p className="text-xs text-destructive">{errors.contactEmail.message}</p>
              )}
            </div>
            <div className="border-t pt-4">
              <AddressSection fieldPrefix="address" labelPrefix="Tienda" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
};
