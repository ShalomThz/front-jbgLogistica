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
  const { register, control, clearErrors, formState: { errors } } = useFormContext<PartnerOrderFormValues>();
  const costsCurrency = useWatch<PartnerOrderFormValues, "shippingService.costBreakdownCurrency">({ name: "shippingService.costBreakdownCurrency" });
  const emptyBoxDelivery = useWatch<PartnerOrderFormValues, "emptyBoxDelivery">({ name: "emptyBoxDelivery" });

  return (
    <Card className="shadow-none transition-shadow focus-within:shadow-lg focus-within:shadow-primary/30">
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
        {emptyBoxDelivery && (
          <div className="space-y-1 rounded-md border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-800 dark:bg-amber-950/20">
            <Label htmlFor="advance-amount" className="text-xs text-amber-700 dark:text-amber-400">
              Anticipo por caja vacía *
            </Label>
            <div className="relative max-w-52">
              <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground">$</span>
              <Input
                id="advance-amount"
                type="number"
                step="0.01"
                min="0"
                aria-invalid={!!errors.advanceAmount}
                {...register("advanceAmount", {
                  onChange: () => clearErrors("advanceAmount"),
                })}
                className="pl-6 text-xs"
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Se cobra al crear la orden por dejar la caja vacía en el domicilio (moneda de la tarifa)
            </p>
            {errors.advanceAmount && (
              <p className="text-sm text-destructive">{errors.advanceAmount.message}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
