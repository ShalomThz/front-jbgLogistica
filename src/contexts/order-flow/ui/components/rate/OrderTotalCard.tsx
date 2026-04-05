import {
  Button,
  Card,
  CardContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
} from "@contexts/shared/shadcn";
import { useFormContext, useWatch, Controller } from "react-hook-form";
import type { HQOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";
import { calculateTotal } from "@contexts/order-flow/domain/services/packageCalculations";
import { CurrencyConversion } from "@contexts/shared/ui/components/CurrencyConversion";
import { ShippingPriceField } from "./ShippingPriceField";

const JBG_SERVICE_NAME = "JBG Logistics";

const COST_BREAKDOWN_FIELDS = ["insurance", "tools", "additionalCost", "wrap", "tape"] as const;
type CostField = (typeof COST_BREAKDOWN_FIELDS)[number];

const COST_LABELS: Record<CostField, string> = {
  insurance: "Seguro",
  tools: "Herramientas",
  additionalCost: "Costo adicional",
  wrap: "Embalaje",
  tape: "Cinta",
};

interface OrderTotalCardProps {
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function OrderTotalCard({ onSubmit, isSubmitting }: OrderTotalCardProps) {
  const { setValue, control } = useFormContext<HQOrderFormValues>();
  const shippingService = useWatch<HQOrderFormValues, "shippingService">({ name: "shippingService" });

  const isJBGRate = shippingService.selectedRate?.serviceName === JBG_SERVICE_NAME;

  const handleCustomPriceChange = (value: string) => {
    if (!shippingService.selectedRate) return;
    const amount = parseFloat(value) || 0;
    setValue("shippingService.selectedRate", {
      ...shippingService.selectedRate,
      price: { ...shippingService.selectedRate.price, amount },
    });
  };

  if (!shippingService.selectedRate) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-4 text-muted-foreground text-sm">
            Selecciona un servicio para ver el total
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <ShippingPriceField
              amount={shippingService.selectedRate.price.amount}
              currency={isJBGRate ? shippingService.currency : shippingService.selectedRate.price.currency}
              isEditable={isJBGRate}
              onChange={handleCustomPriceChange}
            />

            {COST_BREAKDOWN_FIELDS.map((field) => {
              const val = parseFloat(shippingService.costBreakdown[field]);
              if (!val || val <= 0) return null;
              return (
                <div key={field} className="flex justify-between text-sm text-muted-foreground">
                  <span>{COST_LABELS[field]}</span>
                  <span>${val.toFixed(2)}</span>
                </div>
              );
            })}

            <Separator />

            <div className="rounded-lg bg-muted/50 p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Monto total</span>
                {isJBGRate && (
                  <Controller
                    control={control}
                    name="shippingService.currency"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="h-6 w-20 text-xs px-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MXN">MXN</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                )}
              </div>
              <div className="text-2xl font-bold text-blue-600">
                ${calculateTotal(shippingService).toFixed(2)} {isJBGRate ? shippingService.currency : shippingService.selectedRate.price.currency}
              </div>
              <CurrencyConversion amount={calculateTotal(shippingService)} from={isJBGRate ? shippingService.currency : shippingService.selectedRate.price.currency} />
              <div className="text-xs text-muted-foreground">(Incluye IVA)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        className="w-full bg-blue-600 hover:bg-blue-700"
        onClick={onSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Confirmando envío..." : "Confirmar envío"}
      </Button>
    </div>
  );
}
