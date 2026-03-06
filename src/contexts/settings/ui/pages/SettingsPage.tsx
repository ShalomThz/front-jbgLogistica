import { useHQSettings } from "@contexts/settings/infrastructure/hooks/useSkydropxSettings";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label
} from "@contexts/shared/shadcn";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { parseApiError } from "../../../shared/infrastructure/http";
import { AddressSection } from "../../../shared/ui/components/address/AddressSection";
import { hqSettingsSchema, type HQSettingsPrimitives } from "../../domain/schemas/SkydropxAddressSchema";

type FormValues = HQSettingsPrimitives['skydropxAddress'];

function getDefaultValues(
  saved: FormValues | null,
): FormValues {
  return {
    name: saved?.name ?? "",
    company: saved?.company ?? "",
    email: saved?.email ?? "",
    phone: saved?.phone ?? "",
    address: {
      address1: saved?.address.address1 ?? "",
      address2: saved?.address.address2 ?? "",
      city: saved?.address.city ?? "",
      province: saved?.address.province ?? "",
      zip: saved?.address.zip ?? "",
      country: saved?.address.country ?? "MX",
      reference: saved?.address.reference ?? "",
      geolocation: saved?.address.geolocation ?? {
        latitude: 0,
        longitude: 0,
        placeId: null,
      },

    }
  };
}

export function SettingsPage() {
  const { skydropxAddress, isLoading, saveAddress } =
    useHQSettings();

  const form = useForm<FormValues>({
    resolver: zodResolver(hqSettingsSchema.shape.skydropxAddress),
    defaultValues: getDefaultValues(null),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (!isLoading) {
      reset(getDefaultValues(skydropxAddress));
    }
  }, [isLoading, skydropxAddress, reset]);


  const onSubmit = handleSubmit(async (data) => {
    try {
      await saveAddress(data);
      toast.success("Direccion actualizada");
    } catch (error) {
      toast.error(parseApiError(error));
    }
  });

  return (
    <div className="container mx-auto max-w-2xl py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ajustes generales del sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dirección de origen Skydropx</CardTitle>
          <CardDescription>
            Esta dirección se usará como remitente al crear envíos en Skydropx,
            sobreescribiendo la dirección de origen del pedido.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              <div className="border-t pt-4">
                <AddressSection fieldPrefix="address" labelPrefix="Direccion" />
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Guardando..." : "Guardar"}
              </Button>
            </form>
          </FormProvider>
        </CardContent>
      </Card>
    </div>
  );
}
