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
import { ChevronDown, Tag } from "lucide-react";
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
  const discountAmount = parseFloat(shippingService.discount?.amount ?? "") || 0;
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

          <div className="border-t pt-3 space-y-2">
            <Label className="text-xs flex items-center gap-1.5">
              <Tag className="size-3" />
              Descuento
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground">-$</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("shippingService.discount.amount")}
                  className="pl-7 pr-16 text-xs"
                  placeholder="0.00"
                />
                <Controller
                  control={control}
                  name="shippingService.discount.currency"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="absolute right-0 top-0 h-full w-16 border-0 border-l rounded-l-none text-xs px-2">
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
            </div>
            {discountAmount > 0 && (
              <Input
                type="text"
                {...register("shippingService.discount.concept")}
                className="text-xs"
                placeholder="Concepto del descuento"
              />
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
