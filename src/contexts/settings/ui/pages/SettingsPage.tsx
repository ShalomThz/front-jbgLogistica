import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Input,
  Label,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@contexts/shared/shadcn";
import { useSkydropxSettings } from "@contexts/settings/infrastructure/hooks/useSkydropxSettings";
import {
  skydropxAddressFromSchema,
  type SkydropxAddressFromPrimitives,
} from "@contexts/settings/domain/schemas/SkydropxAddressSchema";
import { toast } from "sonner";
import { parseApiError } from "../../../shared/infrastructure/http";

function getDefaultValues(
  saved: SkydropxAddressFromPrimitives | null,
): SkydropxAddressFromPrimitives {
  return {
    name: saved?.name ?? "",
    company: saved?.company ?? "",
    email: saved?.email ?? "",
    phone: saved?.phone ?? "",
    address1: saved?.address1 ?? "",
    address2: saved?.address2 ?? "",
    city: saved?.city ?? "",
    province: saved?.province ?? "",
    zip: saved?.zip ?? "",
    country: saved?.country ?? "MX",
  };
}

export function SettingsPage() {
  const { skydropxAddress, isLoading, saveAddress, isSaving, saveError } =
    useSkydropxSettings();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SkydropxAddressFromPrimitives>({
    resolver: zodResolver(skydropxAddressFromSchema),
    defaultValues: getDefaultValues(null),
  });

  useEffect(() => {
    if (!isLoading) {
      reset(getDefaultValues(skydropxAddress));
    }
  }, [isLoading, skydropxAddress, reset]);

  const onSubmit = async (data: SkydropxAddressFromPrimitives) => {
    try {
      await saveAddress(data);
      toast.success("Direccion actualizada");
    } catch (error) {
      toast.error(parseApiError(error));
    }
  };

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
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nombre de contacto</Label>
                  <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                      <Input id="name" {...field} placeholder="Juan Pérez" />
                    )}
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="company">Empresa</Label>
                  <Controller
                    name="company"
                    control={control}
                    render={({ field }) => (
                      <Input id="company" {...field} placeholder="Mi Empresa S.A." />
                    )}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <Input id="email" type="email" {...field} placeholder="contacto@empresa.com" />
                    )}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Controller
                    name="phone"
                    control={control}
                    render={({ field }) => (
                      <Input id="phone" {...field} placeholder="5512345678" />
                    )}
                  />
                  {errors.phone && (
                    <p className="text-xs text-destructive">{errors.phone.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="address1">Calle y número</Label>
                <Controller
                  name="address1"
                  control={control}
                  render={({ field }) => (
                    <Input id="address1" {...field} placeholder="Av. Insurgentes Sur 1234" />
                  )}
                />
                {errors.address1 && (
                  <p className="text-xs text-destructive">{errors.address1.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="address2">Interior / Referencias</Label>
                <Controller
                  name="address2"
                  control={control}
                  render={({ field }) => (
                    <Input id="address2" {...field} placeholder="Piso 3, Depto 301" />
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="city">Ciudad</Label>
                  <Controller
                    name="city"
                    control={control}
                    render={({ field }) => (
                      <Input id="city" {...field} placeholder="Ciudad de México" />
                    )}
                  />
                  {errors.city && (
                    <p className="text-xs text-destructive">{errors.city.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="province">Estado</Label>
                  <Controller
                    name="province"
                    control={control}
                    render={({ field }) => (
                      <Input id="province" {...field} placeholder="CDMX" />
                    )}
                  />
                  {errors.province && (
                    <p className="text-xs text-destructive">{errors.province.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="zip">Código postal</Label>
                  <Controller
                    name="zip"
                    control={control}
                    render={({ field }) => (
                      <Input id="zip" {...field} placeholder="06600" />
                    )}
                  />
                  {errors.zip && (
                    <p className="text-xs text-destructive">{errors.zip.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="country">País</Label>
                <Controller
                  name="country"
                  control={control}
                  render={({ field }) => (
                    <Input id="country" {...field} placeholder="MX" />
                  )}
                />
                {errors.country && (
                  <p className="text-xs text-destructive">{errors.country.message}</p>
                )}
              </div>

              {saveError && (
                <p className="text-sm text-destructive">{saveError}</p>
              )}

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Guardando..." : "Guardar dirección"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
