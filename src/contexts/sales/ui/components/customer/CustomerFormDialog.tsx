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
import type { CustomerListViewPrimitives } from "@contexts/sales/domain/schemas/customer/CustomerListView";
import {
  createCustomerRequestSchema,
  type CreateCustomerRequest,
} from "@contexts/sales/application/customer/CreateCustomerRequest";
import { useStores } from "@contexts/iam/infrastructure/hooks/stores/useStores";

type FormInput = z.input<typeof createCustomerRequestSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreateCustomerRequest) => void;
  customer?: CustomerListViewPrimitives | null;
  isLoading?: boolean;
}

function getDefaults(customer?: CustomerListViewPrimitives | null): CreateCustomerRequest {
  return {
    name: customer?.name ?? "",
    company: customer?.company ?? "",
    email: customer?.email ?? "",
    phone: customer?.phone ?? "",
    registeredByStoreId: customer?.store.id ?? "",
    address: {
      address1: customer?.address.address1 ?? "",
      address2: customer?.address.address2 ?? "",
      city: customer?.address.city ?? "",
      province: customer?.address.province ?? "",
      zip: customer?.address.zip ?? "",
      country: customer?.address.country ?? "MX",
      reference: customer?.address.reference ?? "",
      geolocation: customer?.address.geolocation ?? {
        latitude: 0,
        longitude: 0,
        placeId: null,
      },
    },
  };
}

export const CustomerFormDialog = ({
  open,
  onClose,
  onSave,
  customer,
  isLoading,
}: Props) => {
  const { stores } = useStores({ page: 1, limit: 100 });

  const form = useForm<FormInput>({
    resolver: zodResolver(createCustomerRequestSchema),
    defaultValues: getDefaults(customer),
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (open) reset(getDefaults(customer));
  }, [open, customer, reset]);

  const onSubmit = handleSubmit((values) => onSave(values as CreateCustomerRequest));

  const isEdit = !!customer;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Cliente" : "Crear Cliente"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Modifica los datos del cliente." : "Ingresa los datos del nuevo cliente."}
          </DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={onSubmit} noValidate className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  aria-invalid={!!errors.name}
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Empresa</Label>
                <Input
                  id="company"
                  aria-invalid={!!errors.company}
                  {...register("company")}
                />
                {errors.company && (
                  <p className="text-xs text-destructive">{errors.company.message}</p>
                )}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  aria-invalid={!!errors.phone}
                  {...register("phone")}
                />
                {errors.phone && (
                  <p className="text-xs text-destructive">{errors.phone.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tienda</Label>
              <Controller
                name="registeredByStoreId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-invalid={!!errors.registeredByStoreId}>
                      <SelectValue placeholder="Seleccionar tienda" />
                    </SelectTrigger>
                    <SelectContent>
                      {stores.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.registeredByStoreId && (
                <p className="text-xs text-destructive">{errors.registeredByStoreId.message}</p>
              )}
            </div>
            <div className="border-t pt-4">
              <AddressSection fieldPrefix="address" labelPrefix="Cliente" />
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
