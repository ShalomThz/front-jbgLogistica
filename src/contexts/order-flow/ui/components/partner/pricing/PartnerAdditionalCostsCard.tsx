import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@contexts/shared/shadcn";
import { useFormContext, useWatch, Controller } from "react-hook-form";
import type { PartnerOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";

const COST_BREAKDOWN_FIELDS = ["insurance", "tools", "additionalCost", "wrap", "tape"] as const;

const COST_LABELS: Record<string, string> = {
  insurance: "Seguro",
  tools: "Herramientas",
  additionalCost: "Costo adicional",
  wrap: "Embalaje",
  tape: "Cinta",
};

export function PartnerAdditionalCostsCard() {
  const { register, control } = useFormContext<PartnerOrderFormValues>();
  const costsCurrency = useWatch<PartnerOrderFormValues, "shippingService.costBreakdownCurrency">({ name: "shippingService.costBreakdownCurrency" });

  return (
    <Card className="shadow-md shadow-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Costos adicionales</CardTitle>
            <p className="text-sm text-muted-foreground">
              Agrega los costos adicionales para esta orden. La tarifa base será calculada automáticamente.
            </p>
          </div>
          <Controller
            control={control}
            name="shippingService.costBreakdownCurrency"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="h-7 w-20 text-xs px-2 shrink-0">
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
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <span className="absolute right-2.5 top-2.5 text-xs text-muted-foreground">{costsCurrency}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
