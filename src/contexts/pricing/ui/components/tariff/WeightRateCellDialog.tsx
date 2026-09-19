import type { SetZoneWeightRateRequest } from "@contexts/pricing/application/WeightRate";
import {
  SERVICE_LEVEL_LABELS,
  SHIPPING_MODE_LABELS,
  type ServiceLevel,
  type WeightRateShippingMode,
} from "@contexts/pricing/domain/schemas/tariff/Tariff";
import type { MoneyPrimitives } from "@contexts/shared/domain/schemas/Money";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@contexts/shared/shadcn";
import { Handshake, Users } from "lucide-react";
import { useState } from "react";

const CURRENCIES = ["MXN", "USD"] as const;
const UNITS = [
  { value: "lb", label: "libras" },
  { value: "kg", label: "kilos" },
] as const;

interface WeightRateCellDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: SetZoneWeightRateRequest) => Promise<unknown>;
  zoneId: string;
  zoneName?: string;
  destinationCountry: string;
  /** Angostado a lo que se puede guardar por peso, no `ShippingMode` entero:
   * este diálogo escribe, y el modo viaja tal cual al request. */
  shippingMode: WeightRateShippingMode;
  serviceLevel: ServiceLevel;
  publicPrice: MoneyPrimitives | null;
  partnerPrice: MoneyPrimitives | null;
  unit: "kg" | "lb";
  minWeight: number | null;
  maxWeight: number | null;
  isLoading?: boolean;
}

/**
 * La celda de la tabla por peso, igual que `ZonePriceCellDialog` en la de
 * cajas: público y socio se escriben juntos.
 *
 * El piso, el techo y la unidad son de la celda y no de cada precio: son las
 * condiciones del servicio, y que difieran entre público y socio no
 * significaría nada.
 *
 * Vaciar un precio borra esa fila, que no es lo mismo que ponerle cero.
 */
export function WeightRateCellDialog({
  open,
  onClose,
  onSave,
  zoneId,
  zoneName,
  destinationCountry,
  shippingMode,
  serviceLevel,
  publicPrice,
  partnerPrice,
  unit,
  minWeight,
  maxWeight,
  isLoading,
}: WeightRateCellDialogProps) {
  // El estado arranca en los valores de la celda, no vacío. Quien lo renderiza
  // monta este componente recién al abrirlo y le pone `key` por servicio, así
  // que los inicializadores corren con la celda correcta cada vez.
  //
  // Sin esto —sembrando después, en un efecto o comparando claves— el primer
  // pintado sale vacío, y vacío significa "borrar esta tarifa".
  const [publicAmount, setPublicAmount] = useState(
    publicPrice ? String(publicPrice.amount) : "",
  );
  const [partnerAmount, setPartnerAmount] = useState(
    partnerPrice ? String(partnerPrice.amount) : "",
  );
  const [currency, setCurrency] = useState<string>(
    publicPrice?.currency ?? partnerPrice?.currency ?? "USD",
  );
  const [unitValue, setUnitValue] = useState<"kg" | "lb">(unit);
  const [min, setMin] = useState(minWeight === null ? "" : String(minWeight));
  const [max, setMax] = useState(maxWeight === null ? "" : String(maxWeight));
  const [error, setError] = useState<string | null>(null);

  const parsePrice = (raw: string): MoneyPrimitives | null => {
    const amount = Number.parseFloat(raw);
    return Number.isFinite(amount) && amount > 0 ? { amount, currency } : null;
  };

  const handleSave = async () => {
    const parsedPublic = parsePrice(publicAmount);
    const parsedPartner = parsePrice(partnerAmount);
    const parsedMin = min.trim() === "" ? 0 : Number.parseFloat(min);
    const parsedMax = max.trim() === "" ? null : Number.parseFloat(max);

    if (!Number.isFinite(parsedMin) || parsedMin < 0) {
      setError("El mínimo tiene que ser un número, y cero si no hay.");
      return;
    }

    if (
      parsedMax !== null &&
      (!Number.isFinite(parsedMax) || parsedMax <= parsedMin)
    ) {
      setError("El máximo tiene que ser mayor que el mínimo.");
      return;
    }

    setError(null);

    await onSave({
      zoneId,
      destinationCountry,
      serviceLevel,
      shippingMode,
      unit: unitValue,
      minWeight: parsedMin,
      maxWeight: parsedMax,
      publicPrice: parsedPublic,
      partnerPrice: parsedPartner,
    });

    onClose();
  };

  const unitLabel = UNITS.find((u) => u.value === unitValue)?.label ?? unitValue;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{SERVICE_LEVEL_LABELS[serviceLevel]} por peso</DialogTitle>
          <DialogDescription>
            {zoneName ?? "Zona"} → {destinationCountry} ·{" "}
            {SHIPPING_MODE_LABELS[shippingMode]}. Se cobra el mayor entre el peso
            real y el volumétrico, con piso en el mínimo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label
                htmlFor="weight-public"
                className="flex items-center gap-1.5"
              >
                <Users className="size-3.5" />
                Público, por {unitLabel.slice(0, -1)}
              </Label>
              <Input
                id="weight-public"
                type="number"
                step="0.01"
                min="0"
                placeholder="Sin precio"
                value={publicAmount}
                onChange={(e) => setPublicAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="weight-partner"
                className="flex items-center gap-1.5"
              >
                <Handshake className="size-3.5" />
                Socio, por {unitLabel.slice(0, -1)}
              </Label>
              <Input
                id="weight-partner"
                type="number"
                step="0.01"
                min="0"
                placeholder="Sin precio"
                value={partnerAmount}
                onChange={(e) => setPartnerAmount(e.target.value)}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Vaciar un precio borra ese renglón, que no es lo mismo que cobrar
            cero.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="space-y-2">
              <Label>Moneda</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Unidad</Label>
              <Select
                value={unitValue}
                onValueChange={(v) => setUnitValue(v as "kg" | "lb")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u.value} value={u.value}>
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight-min">Mínimo</Label>
              <Input
                id="weight-min"
                type="number"
                step="0.01"
                min="0"
                placeholder="0"
                value={min}
                onChange={(e) => setMin(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight-max">Máximo</Label>
              <Input
                id="weight-max"
                type="number"
                step="0.01"
                min="0"
                placeholder="Sin techo"
                value={max}
                onChange={(e) => setMax(e.target.value)}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Debajo del mínimo se cobra el mínimo. Superar el máximo no bloquea:
            avisa al cotizar. El divisor volumétrico se configura en Ajustes.
          </p>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
