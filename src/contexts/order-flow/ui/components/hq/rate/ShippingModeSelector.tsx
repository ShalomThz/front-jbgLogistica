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
 * Modo de transporte. Es a la vez parte del envío —viaja al backend en
 * `selectProvider`— y parte de la clave de la tarifa, así que se elige en el
 * paso de cobro junto a la zona, el servicio y el tipo de precio: cambiarlo
 * recotiza y el efecto se ve ahí mismo.
 */
export function ShippingModeSelector() {
  const { control } = useFormContext<HQOrderFormValues>();

  return (
    <div className="space-y-1">
      <Label htmlFor="shipping-mode-select" className="flex items-center gap-1.5">
        <Truck className="size-3.5" />
        Transporte
      </Label>
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
