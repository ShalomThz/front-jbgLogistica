import type { HQOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";
import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@contexts/shared/shadcn";
import { Plane, Ship, Truck } from "lucide-react";
import { Controller, useFormContext } from "react-hook-form";

/**
 * Modo de transporte del envío. Viaja al backend en la selección de paquetería
 * (`selectProvider`), por eso se elige en este paso y no en el de paquete.
 */
export function ShippingModeSelector() {
  const { control } = useFormContext<HQOrderFormValues>();

  return (
    <div className="space-y-1">
      <Label htmlFor="shipping-mode-select">Modo de envío</Label>
      <Controller
        control={control}
        name="shippingService.shippingMode"
        render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger id="shipping-mode-select" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GROUND">
                <span className="flex items-center gap-2">
                  <Truck className="size-4" />
                  Terrestre
                </span>
              </SelectItem>
              <SelectItem value="AIR">
                <span className="flex items-center gap-2">
                  <Plane className="size-4" />
                  Aéreo
                </span>
              </SelectItem>
              <SelectItem value="SEA">
                <span className="flex items-center gap-2">
                  <Ship className="size-4" />
                  Marítimo
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        )}
      />
    </div>
  );
}
