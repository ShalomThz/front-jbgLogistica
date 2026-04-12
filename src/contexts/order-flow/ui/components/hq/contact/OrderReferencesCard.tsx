import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@contexts/shared/shadcn";
import { Controller, useFormContext } from "react-hook-form";
import type { BaseOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";
import type { StorePrimitives } from "@contexts/iam/domain/schemas/store/Store";

interface OrderReferencesCardProps {
  stores?: Pick<StorePrimitives, "id" | "name">[];
  selectedStoreId?: string;
  onStoreChange?: (storeId: string) => void;
}

export function OrderReferencesCard({ stores, selectedStoreId, onStoreChange }: OrderReferencesCardProps = {}) {
  const { register, control, clearErrors, formState: { errors } } = useFormContext<BaseOrderFormValues>();

  return (
    <Card className="mb-6 shadow-md shadow-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Información de la Orden</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {stores && onStoreChange && (
          <div className="space-y-1">
            <Label htmlFor="store-select">Tienda *</Label>
            <Select value={selectedStoreId} onValueChange={onStoreChange}>
              <SelectTrigger id="store-select" className="w-full">
                <SelectValue placeholder="Selecciona una tienda" />
              </SelectTrigger>
              <SelectContent>
                {stores.map((store) => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="order-number">Factura jbg*</Label>
            <Input
              id="order-number"
              aria-invalid={!!errors.orderData?.orderNumber}
              placeholder="Ej: ORD-001234"
              {...register("orderData.orderNumber", {
                onChange: () => clearErrors("orderData.orderNumber"),
              })}
            />
            {errors.orderData?.orderNumber && (
              <p className="text-sm text-destructive">{errors.orderData.orderNumber.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="partner-order-number">Orden o factura  tienda o agente</Label>
            <Input
              id="partner-order-number"
              aria-invalid={!!errors.orderData?.partnerOrderNumber}
              placeholder="Ej: PART-567890"
              {...register("orderData.partnerOrderNumber", {
                onChange: () => clearErrors("orderData.partnerOrderNumber"),
              })}
            />
            {errors.orderData?.partnerOrderNumber && (
              <p className="text-sm text-destructive">{errors.orderData.partnerOrderNumber.message}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Controller
            control={control}
            name="pickupAtAddress"
            render={({ field }) => (
              <Checkbox
                id="pickup-at-address"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <Label htmlFor="pickup-at-address" className="cursor-pointer font-normal">
            Recoger en domicilio del remitente
          </Label>
        </div>
      </CardContent>
    </Card>
  );
}
