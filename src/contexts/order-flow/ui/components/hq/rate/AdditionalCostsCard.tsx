import {
  Card,
  CardContent,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@contexts/shared/shadcn";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useFormContext, useWatch, Controller } from "react-hook-form";
import type { HQOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";

const COST_BREAKDOWN_FIELDS = ["insurance", "tools", "additionalCost", "wrap", "tape"] as const;

const COST_LABELS: Record<string, string> = {
  insurance: "Seguro",
  tools: "Herramientas",
  additionalCost: "Costo adicional",
  wrap: "Embalaje",
  tape: "Cinta",
};

export function AdditionalCostsCard() {
  const { register, control } = useFormContext<HQOrderFormValues>();
  const shippingService = useWatch<HQOrderFormValues, "shippingService">({ name: "shippingService" });
  const [open, setOpen] = useState(true);

  const total = COST_BREAKDOWN_FIELDS.reduce((sum, field) => {
    const val = parseFloat(shippingService.costBreakdown[field]);
    return sum + (val > 0 ? val : 0);
  }, 0);

  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-6 py-4 text-left"
      >
        <span className="text-sm font-semibold">Costos adicionales</span>
        <div className="flex items-center gap-2">
          {total > 0 && (
            <span className="text-xs font-medium text-muted-foreground">
              ${total.toFixed(2)} {shippingService.costBreakdownCurrency}
            </span>
          )}
          <ChevronDown className={`size-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>
      {open && (
        <CardContent className="pt-0 pb-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Moneda de costos</span>
            <Controller
              control={control}
              name="shippingService.costBreakdownCurrency"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-7 w-20 text-xs px-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MXN">MXN</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {COST_BREAKDOWN_FIELDS.map((field) => (
              <div key={field} className="space-y-1">
                <Label className="text-xs">{COST_LABELS[field]}</Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register(`shippingService.costBreakdown.${field}`)}
                    className="pl-6 pr-12 text-xs"
                    placeholder="0.00"
                  />
                  <span className="absolute right-2.5 top-2.5 text-xs text-muted-foreground">
                    {shippingService.costBreakdownCurrency}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
