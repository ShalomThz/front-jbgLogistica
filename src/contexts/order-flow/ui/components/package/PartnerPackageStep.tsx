import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@contexts/shared/shadcn";
import { useFormContext, useWatch, Controller } from "react-hook-form";
import { Building2, Info, User } from "lucide-react";
import boxIsometricSvg from "@/assets/box-isometric.svg";
import type { NewOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";
import { BoxSelector } from "./BoxSelector";
import { ShippingSummary } from "../ShippingSummary";

interface PartnerPackageStepProps {
  onEditContacts: () => void;
}

export function PartnerPackageStep({ onEditContacts }: PartnerPackageStepProps) {
  const { register, control, formState: { errors } } = useFormContext<NewOrderFormValues>();
  const pkg = useWatch<NewOrderFormValues, "package">({ name: "package" });

  const hasVolume = !!(pkg.length && pkg.width && pkg.height);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left column */}
      <Card className="flex-[3] shadow-md shadow-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Dimensiones del paquete</CardTitle>
          <p className="text-sm text-muted-foreground">
            Medidas del paquete
          </p>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {/* Ownership select */}
          <div className="space-y-2">
            <Label>Propiedad de la caja *</Label>
            <div className="flex items-center gap-3">
              <Controller
                control={control}
                name="package.ownership"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CUSTOMER">
                        <span className="flex items-center gap-2">
                          <User className="size-4" />
                          Caja del cliente
                        </span>
                      </SelectItem>
                      <SelectItem value="STORE">
                        <span className="flex items-center gap-2">
                          <Building2 className="size-4" />
                          Caja de la tienda
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {pkg.ownership === "STORE" && (
                <p className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 whitespace-nowrap">
                  <Info className="size-3.5 shrink-0" />
                  Se descontará del inventario al terminar la orden
                </p>
              )}
              {pkg.ownership === "CUSTOMER" && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                  <Info className="size-3.5 shrink-0" />
                  No se descontará del inventario
                </p>
              )}
            </div>
          </div>

          {/* Inner 2-col grid: form | image */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sub-col 1: box selector + dimensions */}
            <div className="space-y-4">
              <BoxSelector />

              {/* Inline dimensions (no weight, no quantity) */}
              <div className="space-y-4">
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
              </div>
            </div>

            {/* Sub-col 2: image (dimensions only, no weight calculations) */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col items-center justify-center gap-2 rounded-lg border bg-muted/30 py-6">
                <img src={boxIsometricSvg} alt="Caja" className="w-32 h-auto" />
                <p className="text-sm text-muted-foreground">
                  {pkg.packageType || "Sin caja seleccionada"}
                </p>
                {hasVolume && (
                  <p className="text-xs text-muted-foreground">
                    {pkg.length} × {pkg.width} × {pkg.height} {pkg.dimensionUnit}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Right column: shipping summary */}
      <div className="flex-1 space-y-4">
        <ShippingSummary onEditContacts={onEditContacts} />
      </div>
    </div>
  );
}
