import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@contexts/shared/shadcn";
import type { TariffPrimitives } from "@contexts/pricing/domain/schemas/tariff/Tariff";
import { useZones } from "@contexts/pricing/infrastructure/hooks/zones/useZones";
import { useBoxes } from "@contexts/inventory/infrastructure/hooks/boxes/useBoxes";

type CreateTariffData = Omit<TariffPrimitives, "id" | "createdAt" | "updatedAt">;

const COUNTRIES = [
  { code: "MX", name: "México" },
  { code: "US", name: "Estados Unidos" },
  { code: "CA", name: "Canadá" },
  { code: "ES", name: "España" },
  { code: "CO", name: "Colombia" },
];

const CURRENCIES = ["MXN", "USD", "EUR"];

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreateTariffData) => void;
  tariff?: TariffPrimitives | null;
  isLoading?: boolean;
}

export const TariffFormDialog = ({ open, onClose, onSave, tariff, isLoading }: Props) => {
  const { zones } = useZones({ page: 1, limit: 100 });
  const { boxes } = useBoxes();

  const [originZoneId, setOriginZoneId] = useState("");
  const [destinationCountry, setDestinationCountry] = useState("");
  const [boxId, setBoxId] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("MXN");

  useEffect(() => {
    if (open) {
      setOriginZoneId(tariff?.originZoneId ?? "");
      setDestinationCountry(tariff?.destinationCountry ?? "");
      setBoxId(tariff?.boxId ?? "");
      setAmount(tariff?.price.amount?.toString() ?? "");
      setCurrency(tariff?.price.currency ?? "MXN");
    }
  }, [open, tariff]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      originZoneId,
      destinationCountry,
      boxId,
      price: { amount: Number(amount), currency },
    });
  };

  const isEdit = !!tariff;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Tarifa" : "Crear Tarifa"}</DialogTitle>
          <DialogDescription>{isEdit ? "Modifica los datos de la tarifa." : "Ingresa los datos de la nueva tarifa."}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Zona de origen</Label>
            <Select value={originZoneId} onValueChange={setOriginZoneId} required>
              <SelectTrigger><SelectValue placeholder="Seleccionar zona" /></SelectTrigger>
              <SelectContent>
                {zones.map((z) => <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>País de destino</Label>
            <Select value={destinationCountry} onValueChange={setDestinationCountry} required>
              <SelectTrigger><SelectValue placeholder="Seleccionar país" /></SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Caja</Label>
            <Select value={boxId} onValueChange={setBoxId} required>
              <SelectTrigger><SelectValue placeholder="Seleccionar caja" /></SelectTrigger>
              <SelectContent>
                {boxes.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="amount">Precio</Label>
              <Input id="amount" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required />
            </div>
            <div className="space-y-2">
              <Label>Moneda</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>{isLoading ? "Guardando..." : "Guardar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
