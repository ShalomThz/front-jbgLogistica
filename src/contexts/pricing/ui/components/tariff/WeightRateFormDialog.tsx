import type {
  CreateWeightRateRequest,
  WeightRatePrimitives,
} from "@contexts/pricing/application/WeightRate";
import {
  PRICE_TYPE_LABELS,
  SERVICE_LEVEL_LABELS,
  SHIPPING_MODE_LABELS,
  priceTypes,
  serviceLevels,
  type PriceType,
  type ServiceLevel,
  type ShippingMode,
} from "@contexts/pricing/domain/schemas/tariff/Tariff";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useState } from "react";

interface WeightRateFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (request: CreateWeightRateRequest) => Promise<unknown>;
  zoneId: string;
  zoneName?: string;
  destinationCountry: string;
  /** Viene de la página, no se elige acá: es el mismo selector que decide si se
   * ve la matriz de cajas o esta tabla. Ofrecerlo de nuevo dejaría crear una
   * fila que después no aparece bajo el modo en que se está mirando. */
  shippingMode: ShippingMode;
  /** La fila que se edita, o `null` para un alta. */
  editing: WeightRatePrimitives | null;
  isSaving: boolean;
}

const UNITS = [
  { value: "lb", label: "libras" },
  { value: "kg", label: "kilos" },
] as const;

/**
 * Alta y edición de una tarifa por peso.
 *
 * No pide caja: un servicio que cobra por peso no mira cuál es. Y no pide
 * divisor volumétrico — ése es un ajuste global, en Ajustes, porque es un solo
 * número para toda la operación y tenerlo por fila garantiza que un día dejen
 * de coincidir.
 */
export function WeightRateFormDialog({
  open,
  onClose,
  onSave,
  zoneId,
  zoneName,
  destinationCountry,
  shippingMode,
  editing,
  isSaving,
}: WeightRateFormDialogProps) {
  const [serviceLevel, setServiceLevel] = useState<ServiceLevel>("EXPRESS");
  const [priceType, setPriceType] = useState<PriceType>("PUBLIC");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [unit, setUnit] = useState<"kg" | "lb">("lb");
  const [minWeight, setMinWeight] = useState("");
  const [maxWeight, setMaxWeight] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Se siembra en render y no en un efecto: un efecto pinta una vez con los
  // valores del formulario anterior antes de corregirse, y al reabrir para
  // editar otra fila eso se ve. Mismo patrón que `usePartnerOrderFlow`.
  const formKey = open ? (editing?.id ?? "nueva") : "cerrado";
  const [lastFormKey, setLastFormKey] = useState(formKey);

  if (formKey !== lastFormKey) {
    setLastFormKey(formKey);
    setError(null);

    if (editing) {
      setServiceLevel(editing.serviceLevel);
      setPriceType(editing.priceType);
      setAmount(String(editing.pricePerUnit.amount));
      setCurrency(editing.pricePerUnit.currency);
      setUnit(editing.unit);
      setMinWeight(String(editing.minWeight));
      setMaxWeight(editing.maxWeight === null ? "" : String(editing.maxWeight));
    } else {
      // El alta arranca en express: es el nivel de las filas por peso que
      // existen hoy. Se puede cambiar; el modo no, lo fija la página.
      setServiceLevel("EXPRESS");
      setPriceType("PUBLIC");
      setAmount("");
      setCurrency("USD");
      setUnit("lb");
      setMinWeight("");
      setMaxWeight("");
    }
  }

  const handleSave = async () => {
    const parsedAmount = Number.parseFloat(amount);
    const parsedMin = Number.parseFloat(minWeight);
    // Vacío es "sin techo", que es distinto de cero.
    const parsedMax = maxWeight.trim() === "" ? null : Number.parseFloat(maxWeight);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("El precio por unidad tiene que ser mayor que cero.");
      return;
    }

    if (!Number.isFinite(parsedMin) || parsedMin < 0) {
      setError("El mínimo tiene que ser un número, y cero si no hay.");
      return;
    }

    if (parsedMax !== null && (!Number.isFinite(parsedMax) || parsedMax <= parsedMin)) {
      setError("El máximo tiene que ser mayor que el mínimo.");
      return;
    }

    setError(null);

    await onSave({
      zoneId,
      destinationCountry,
      serviceLevel,
      shippingMode,
      priceType,
      pricePerUnit: { amount: parsedAmount, currency },
      unit,
      minWeight: parsedMin,
      maxWeight: parsedMax,
    });

    onClose();
  };

  const unitLabel = UNITS.find((u) => u.value === unit)?.label ?? unit;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Editar tarifa por peso" : "Nueva tarifa por peso"}
          </DialogTitle>
          <DialogDescription>
            {zoneName ?? "Zona"} → {destinationCountry} ·{" "}
            {SHIPPING_MODE_LABELS[shippingMode]}. Se cobra el mayor entre el
            peso real y el volumétrico, con piso en el mínimo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Nivel de servicio</Label>
              <Select
                value={serviceLevel}
                onValueChange={(v) => setServiceLevel(v as ServiceLevel)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {serviceLevels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {SERVICE_LEVEL_LABELS[level]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de precio</Label>
              <Select
                value={priceType}
                onValueChange={(v) => setPriceType(v as PriceType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priceTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {PRICE_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Precio por {unitLabel.slice(0, -1)}</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="4.50"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Moneda</Label>
              <Input
                value={currency}
                maxLength={3}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
              />
            </div>

            <div className="space-y-2">
              <Label>Unidad</Label>
              <Select
                value={unit}
                onValueChange={(v) => setUnit(v as "kg" | "lb")}
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
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Mínimo ({unitLabel})</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="15"
                value={minWeight}
                onChange={(e) => setMinWeight(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Debajo de este peso se cobra este peso.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Máximo ({unitLabel})</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Sin techo"
                value={maxWeight}
                onChange={(e) => setMaxWeight(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Vacío es sin techo. Superarlo no bloquea: solo avisa al cotizar.
              </p>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
