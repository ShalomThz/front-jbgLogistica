import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@contexts/shared/shadcn";
import { Store } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";
import type { PartnerOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";

const COST_BREAKDOWN_FIELDS = [
  "insurance",
  "tools",
  "additionalCost",
  "wrap",
  "tape",
] as const;

const COST_LABELS: Record<(typeof COST_BREAKDOWN_FIELDS)[number], string> = {
  insurance: "Seguro",
  tools: "Herramientas",
  additionalCost: "Costo adicional",
  wrap: "Embalaje",
  tape: "Cinta",
};

interface PartnerSaleCostsCardProps {
  /** La tienda del socio. Va en el encabezado por el mismo motivo que el logo de
   * JBG en la card de enfrente: dice de quién es esta plata. */
  storeName: string;
}

/**
 * Los extras que el socio le suma a su cliente.
 *
 * Espejo de `PartnerAdditionalCostsCard`, que hace lo mismo con los cargos de
 * JBG en el paso de Cotización. Mismos cinco renglones y mismo orden a propósito:
 * el socio puede mirar las dos pantallas y comparar lo que le cobran contra lo
 * que cobra, renglón por renglón.
 *
 * Sin selector de moneda, a diferencia de la de JBG: acá la manda la de la venta
 * —está en la card de al lado, junto al servicio— porque `PartnerSale` exige una
 * sola en base, extras y abonos. Ofrecer otra sería ofrecer un error.
 */
export function PartnerSaleCostsCard({ storeName }: PartnerSaleCostsCardProps) {
  const { register, control } = useFormContext<PartnerOrderFormValues>();
  const currency = useWatch<PartnerOrderFormValues, "partnerSale.currency">({
    control,
    name: "partnerSale.currency",
  });

  return (
    <Card className="shadow-none transition-shadow focus-within:shadow-lg focus-within:shadow-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Store className="size-3.5" />
          {storeName}
        </div>
        <CardTitle className="text-base">Extras que le cobras</CardTitle>
        <p className="text-sm text-muted-foreground">
          Lo que le cargas a tu cliente además del servicio. Se suma al total que
          le cobras y sale desglosado en su factura.
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* El descuento primero, marcado en rojo: es el único renglón que
              resta, y mezclado entre los que suman se leía como uno más. */}
          <div className="space-y-1 sm:col-span-2 lg:col-span-3">
            <Label className="text-xs text-red-600 dark:text-red-400">
              Descuento
            </Label>
            <div className="flex gap-2">
              <div className="relative w-40 shrink-0">
                <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground">
                  −$
                </span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("partnerSale.discount.amount")}
                  className="pl-8 pr-12 text-xs"
                  placeholder="0.00"
                />
                <span className="absolute right-2.5 top-2.5 text-xs text-muted-foreground">
                  {currency}
                </span>
              </div>
              {/* El motivo va al lado y no aparte: un descuento sin concepto no
                  se puede explicar después, ni al cliente ni a quien audite. */}
              <Input
                {...register("partnerSale.discount.concept")}
                className="flex-1 text-xs"
                placeholder="Motivo (ej. cliente frecuente)"
                maxLength={200}
              />
            </div>
          </div>

          {COST_BREAKDOWN_FIELDS.map((field) => (
            <div key={field} className="space-y-1">
              <Label className="text-xs">{COST_LABELS[field]}</Label>
              <div className="relative">
                <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register(`partnerSale.costBreakdown.${field}`)}
                  className="pl-6 pr-12 text-xs"
                  placeholder="0.00"
                />
                <span className="absolute right-2.5 top-2.5 text-xs text-muted-foreground">
                  {currency}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
