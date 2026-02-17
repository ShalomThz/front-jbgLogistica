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
import { Package } from "lucide-react";
import { useFormContext, Controller } from "react-hook-form";
import type { NewOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";
import { BoxSelector } from "./BoxSelector";
import { DimensionsForm } from "./DimensionsForm";
import { ProductTypeSelector } from "./ProductTypeSelector";
import { ShippingSummary } from "../ShippingSummary";

interface PackageStepProps {
  onEditContacts: () => void;
}

export function PackageStep({ onEditContacts }: PackageStepProps) {
  const { control } = useFormContext<NewOrderFormValues>();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Package Configuration */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="size-4" />
              Dimensiones y tipo de producto
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Medidas, peso y contenido del paquete
            </p>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {/* Ownership */}
            <div>
              <Label>Propiedad de la caja *</Label>
              <Controller
                control={control}
                name="package.ownership"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CUSTOMER">Caja del cliente</SelectItem>
                      <SelectItem value="STORE">Caja de la tienda</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <BoxSelector />
            <DimensionsForm />

            <Separator />

            <ProductTypeSelector />
          </CardContent>
        </Card>
      </div>

      {/* Shipping Summary */}
      <div className="space-y-4">
        <ShippingSummary onEditContacts={onEditContacts} />
      </div>
    </div>
  );
}
