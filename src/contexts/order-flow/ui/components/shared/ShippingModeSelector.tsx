import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@contexts/shared/shadcn";
import {
  SHIPPING_MODE_LABELS,
  shippingModes,
  type ShippingMode,
} from "@contexts/pricing/domain/schemas/tariff/Tariff";
import { Plane, Ship, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const MODE_ICONS: Record<ShippingMode, LucideIcon> = {
  GROUND: Truck,
  AIR: Plane,
  SEA: Ship,
};

interface ShippingModeSelectorProps {
  value: ShippingMode;
  onChange: (shippingMode: ShippingMode) => void;
  disabled?: boolean;
  label?: string;
}

/**
 * Por dónde viaja la caja. Junto con la zona, la caja y el servicio determina
 * el renglón de la tabla de tarifas: el mismo paquete por aire y por mar son
 * dos precios distintos, y si el modo no está cargado la combinación no tiene
 * tarifa —no hereda la terrestre—.
 */
export function ShippingModeSelector({
  value,
  onChange,
  disabled,
  label = "Transporte",
}: ShippingModeSelectorProps) {
  const Icon = MODE_ICONS[value];

  return (
    <div className="space-y-1">
      <Label htmlFor="shipping-mode" className="flex items-center gap-1.5">
        <Icon className="size-3.5" />
        {label}
      </Label>
      <Select
        value={value}
        onValueChange={(v) => onChange(v as ShippingMode)}
        disabled={disabled}
      >
        <SelectTrigger id="shipping-mode" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {shippingModes.map((mode) => {
            const ModeIcon = MODE_ICONS[mode];
            return (
              <SelectItem key={mode} value={mode}>
                <span className="flex items-center gap-2">
                  <ModeIcon className="size-3.5 text-muted-foreground" />
                  {SHIPPING_MODE_LABELS[mode]}
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
