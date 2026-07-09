import { useZones } from "@contexts/pricing/infrastructure/hooks/zones/useZones";
import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@contexts/shared/shadcn";
import { MapPin } from "lucide-react";

interface ZoneSelectorProps {
  /** Zona efectiva para la cotización (override o la de la tienda). */
  zoneId: string | undefined;
  onZoneChange: (zoneId: string) => void;
  disabled?: boolean;
}

/**
 * Permite al vendedor cotizar con las tarifas de otra zona (por defecto se usa
 * la zona de la tienda seleccionada). Solo cambia la búsqueda de tarifa en el
 * front — la zona no viaja al backend.
 */
export function ZoneSelector({ zoneId, onZoneChange, disabled }: ZoneSelectorProps) {
  // Sin limit → todas las zonas (catálogo pequeño)
  const { zones, isLoading } = useZones();

  return (
    <div className="space-y-1">
      <Label htmlFor="zone-select" className="flex items-center gap-1.5">
        <MapPin className="size-3.5" />
        Zona de tarifas
      </Label>
      <Select value={zoneId ?? ""} onValueChange={onZoneChange} disabled={disabled || isLoading}>
        <SelectTrigger id="zone-select" className="w-full">
          <SelectValue placeholder={isLoading ? "Cargando zonas..." : "Selecciona una zona"} />
        </SelectTrigger>
        <SelectContent>
          {zones.map((zone) => (
            <SelectItem key={zone.id} value={zone.id}>
              {zone.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
