import { useEffect, useState } from "react";
import { AlertTriangle, Coins, Gauge, Handshake, MapPin, Package, Users } from "lucide-react";
import {
  Badge,
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
import type { SetZonePriceRequest } from "@contexts/pricing/application/ZonePriceMatrix";
import type { ServiceLevel } from "@contexts/pricing/domain/schemas/tariff/Tariff";
import {
  SERVICE_LEVEL_COLORS,
  SERVICE_LEVEL_LABELS,
} from "@contexts/pricing/domain/schemas/tariff/Tariff";
import type { MoneyPrimitives } from "@contexts/shared/domain/schemas/Money";

const CURRENCIES = ["MXN", "USD"] as const;

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: SetZonePriceRequest) => Promise<unknown>;
  zoneId: string;
  zoneName?: string;
  boxId: string;
  boxName?: string;
  serviceLevel: ServiceLevel;
  publicPrice: MoneyPrimitives | null;
  partnerPrice: MoneyPrimitives | null;
  isLoading?: boolean;
}

/**
 * Edita la celda completa. El admin piensa en "la tarifa de esta caja con este
 * servicio" como una cosa, aunque en la tabla sean dos filas: exponer el CRUD
 * fila por fila garantiza que alguien actualice el público y se olvide del socio.
 *
 * Vaciar un campo borra ese precio — no es lo mismo que cobrar cero.
 */
export function ZonePriceCellDialog({
  open,
  onClose,
  onSave,
  zoneId,
  zoneName,
  boxId,
  boxName,
  serviceLevel,
  publicPrice,
  partnerPrice,
  isLoading,
}: Props) {
  const [publicAmount, setPublicAmount] = useState("");
  const [partnerAmount, setPartnerAmount] = useState("");
  const [currency, setCurrency] = useState<string>("MXN");

  useEffect(() => {
    if (!open) return;
    setPublicAmount(publicPrice ? String(publicPrice.amount) : "");
    setPartnerAmount(partnerPrice ? String(partnerPrice.amount) : "");
    setCurrency(publicPrice?.currency ?? partnerPrice?.currency ?? "MXN");
  }, [open, publicPrice, partnerPrice]);

  const toMoney = (raw: string): MoneyPrimitives | null => {
    const trimmed = raw.trim();
    if (trimmed === "") return null;
    const amount = Number.parseFloat(trimmed);
    return Number.isFinite(amount) && amount >= 0 ? { amount, currency } : null;
  };

  const publicMoney = toMoney(publicAmount);
  const partnerMoney = toMoney(partnerAmount);

  // Aviso, no bloqueo: el socio debería ser más barato para tener margen, pero
  // una promoción puntual puede romperlo legítimamente.
  const marginWarning =
    publicMoney !== null &&
    partnerMoney !== null &&
    partnerMoney.amount > publicMoney.amount;

  const handleSubmit = async () => {
    await onSave({
      zoneId,
      boxId,
      serviceLevel,
      publicPrice: publicMoney,
      partnerPrice: partnerMoney,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Precios de la celda</DialogTitle>
          <DialogDescription>
            Qué caja, con qué servicio y en qué zona se está cotizando.
          </DialogDescription>
        </DialogHeader>

        {/* Los tres factores con distinto peso: el servicio es el que más se
            confunde —la misma caja y zona tienen una celda por servicio— así
            que va en color de acento; la caja en neutro y la zona en contorno,
            que es contexto ya elegido arriba. */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1.5 py-1">
            <Package className="size-3.5" />
            <span className="text-[10px] uppercase tracking-wide opacity-70">
              Caja
            </span>
            {boxName ?? "—"}
          </Badge>
          <Badge
            variant="secondary"
            className={`gap-1.5 py-1 ${SERVICE_LEVEL_COLORS[serviceLevel]}`}
          >
            <Gauge className="size-3.5" />
            <span className="text-[10px] uppercase tracking-wide opacity-70">
              Servicio
            </span>
            {SERVICE_LEVEL_LABELS[serviceLevel]}
          </Badge>
          <Badge variant="outline" className="gap-1.5 py-1">
            <MapPin className="size-3.5" />
            <span className="text-[10px] uppercase tracking-wide opacity-70">
              Zona
            </span>
            {zoneName ?? "—"}
          </Badge>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currency" className="flex items-center gap-1.5">
              <Coins className="size-3.5" />
              Moneda
            </Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger id="currency" className="w-28">
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="publicPrice" className="flex items-center gap-1.5">
                <Users className="size-3.5" />
                Precio público
              </Label>
              <Input
                id="publicPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="Sin precio"
                value={publicAmount}
                onChange={(e) => setPublicAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partnerPrice" className="flex items-center gap-1.5">
                <Handshake className="size-3.5" />
                Precio socio
              </Label>
              <Input
                id="partnerPrice"
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
            Dejar un campo vacío borra ese precio: la combinación queda sin tarifa.
          </p>

          {marginWarning && (
            <div className="flex items-start gap-2 rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
              <AlertTriangle className="size-4 shrink-0" />
              <span>
                El precio socio es mayor que el público. El socio no tendría margen —
                revisa que sea intencional.
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
