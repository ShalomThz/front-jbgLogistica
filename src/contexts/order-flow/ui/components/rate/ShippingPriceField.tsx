import { Input } from "@contexts/shared/shadcn";

interface ShippingPriceFieldProps {
  amount: number;
  currency: string;
  isEditable: boolean;
  onChange: (value: string) => void;
}

export function ShippingPriceField({ amount, currency, isEditable, onChange }: ShippingPriceFieldProps) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span>Precio del servicio</span>
      {isEditable ? (
        <div className="relative w-28">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={amount ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className="h-7 pl-5 pr-12 text-xs text-right"
            placeholder="0.00"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{currency}</span>
        </div>
      ) : (
        <span>${amount.toFixed(2)} {currency}</span>
      )}
    </div>
  );
}
