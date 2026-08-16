import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@contexts/shared/shadcn";
import {
  SERVICE_LEVEL_DOTS,
  SERVICE_LEVEL_LABELS,
  serviceLevels,
  type ServiceLevel,
} from "@contexts/pricing/domain/schemas/tariff/Tariff";
import { Gauge } from "lucide-react";

interface ServiceLevelSelectorProps {
  value: ServiceLevel;
  onChange: (serviceLevel: ServiceLevel) => void;
  disabled?: boolean;
}

/**
 * Velocidad contratada. Junto con la zona de recolección y la caja, es lo que
 * determina el renglón de la tabla de tarifas.
 *
 * No confundir con el modo de envío (terrestre / aéreo / marítimo): aquél
 * describe el transporte, éste lo que se le vende al cliente.
 */
export function ServiceLevelSelector({
  value,
  onChange,
  disabled,
}: ServiceLevelSelectorProps) {
  return (
    <div className="space-y-1">
      <Label htmlFor="service-level" className="flex items-center gap-1.5">
        <Gauge className="size-3.5" />
        Servicio
      </Label>
      <Select
        value={value}
        onValueChange={(v) => onChange(v as ServiceLevel)}
        disabled={disabled}
      >
        <SelectTrigger id="service-level" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {serviceLevels.map((level) => (
            <SelectItem key={level} value={level}>
              <span className="flex items-center gap-2">
                <span
                  className={`size-2 rounded-full ${SERVICE_LEVEL_DOTS[level]}`}
                />
                {SERVICE_LEVEL_LABELS[level]}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
