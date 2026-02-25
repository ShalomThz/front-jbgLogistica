import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
} from "@contexts/shared/shadcn";
import { useFormContext, useWatch, Controller } from "react-hook-form";
import { Building2, Info, User } from "lucide-react";
import boxIsometricSvg from "@/assets/box-isometric.svg";
import type { NewOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";
import { calculateVolumetricWeight, calculateBillableWeight } from "@contexts/order-flow/domain/services/packageCalculations";
import { BoxSelector } from "./BoxSelector";
import { DimensionsForm } from "./DimensionsForm";
import { ProductTypeSelector } from "./ProductTypeSelector";
import { ShippingSummary } from "../ShippingSummary";

interface PackageStepProps {
  onEditContacts: () => void;
}

export function PackageStep({ onEditContacts }: PackageStepProps) {
  const { control } = useFormContext<NewOrderFormValues>();
  const pkg = useWatch<NewOrderFormValues, "package">({ name: "package" });

  const hasVolume = !!(pkg.length && pkg.width && pkg.height);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left column */}
      <Card className="flex-[3] shadow-md shadow-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Dimensiones y tipo de producto</CardTitle>
          <p className="text-sm text-muted-foreground">
            Medidas, peso y contenido del paquete
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

          {/* Inner 2-col grid: form | image + calculations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sub-col 1: box selector + dimensions */}
            <div className="space-y-4">
              <BoxSelector />
              <DimensionsForm />
            </div>

            {/* Sub-col 2: image + weight calculations */}
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

              <div className="rounded-lg border p-4 space-y-2">
                <p className="text-sm font-medium">Cálculo de peso</p>
                {hasVolume ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-xs">Peso masa</span>
                      <span className="font-semibold text-xs">{pkg.weight || 0} {pkg.weightUnit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-xs">Peso volumétrico</span>
                      <span className="font-semibold text-xs">{calculateVolumetricWeight(pkg).toFixed(2)} {pkg.weightUnit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-xs">Peso a cotizar</span>
                      <span className="font-semibold text-xs text-primary">{calculateBillableWeight(pkg).toFixed(2)} {pkg.weightUnit}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    Ingresa las dimensiones para ver el cálculo
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <ProductTypeSelector />
        </CardContent>
      </Card>

      {/* Right column: shipping summary */}
      <div className="flex-1 space-y-4">
        <ShippingSummary onEditContacts={onEditContacts} />
      </div>
    </div>
  );
}
