import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Label,
} from "@contexts/shared/shadcn";
import { Controller, useFormContext } from "react-hook-form";
import type { NewOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";
import { ContactColumn } from "./ContactColumn";

export function HQContactStep() {
  const { register, control, formState: { errors } } = useFormContext<NewOrderFormValues>();

  return (
    <>
      <Card className="mb-6 shadow-md shadow-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Información de la Orden</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="space-y-1">
            <Label htmlFor="order-number">Número de Orden *</Label>
            <Input
              id="order-number"
              aria-invalid={!!errors.orderData?.orderNumber}
              placeholder="Ej: ORD-001234"
              {...register("orderData.orderNumber")}
            />
            {errors.orderData?.orderNumber && (
              <p className="text-sm text-destructive">{errors.orderData.orderNumber.message}</p>
            )}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ContactColumn fieldPrefix="sender" title="Remitente" />
        <ContactColumn fieldPrefix="recipient" title="Destinatario" />
      </div>
    </>
  );
}
