import type { MoneyPrimitives } from "@contexts/shared/domain/schemas/Money";
import { useExchangeRate } from "@contexts/shared/infrastructure/hooks/useExchangeRate";

interface BilledTotalInput {
  /** La tarifa tal como la cotizó el servidor. **Su moneda es la de
   * facturación**: es en ella que el backend calcula `totalBilled` y contra la
   * que concilia los abonos. */
  tariff: MoneyPrimitives | null;
  /** Los cinco extras ya sumados, en `costsCurrency`. */
  costs: number;
  costsCurrency: string;
  /** El descuento, **solo si el request lo manda**. La orden de socio no lo
   * manda (ni `buildPartnerOrderRequest` ni `buildPartnerEditOrderRequest` lo
   * incluyen), así que allá no se pasa: restarlo acá dejaría al front cobrando
   * de menos contra un total que el backend calculó sin él. */
  discount?: number;
  discountCurrency?: string;
}

/**
 * El total contra el que se cobra, **siempre en la moneda de la tarifa**.
 *
 * Es el espejo de `OrderFinancials.calculateTotalBilled`: misma cuenta, mismo
 * piso en cero y, sobre todo, misma moneda de destino. Esa última parte es la
 * razón de que esto sea un hook y no una función suelta: la cuenta nunca estuvo
 * mal, lo que se equivocaba era hacia dónde convertía cada pantalla antes de
 * sumar. `OrderTotalCard` convertía todo a la moneda de **visualización** —un
 * selector que no viaja al servidor— y después rotulaba el resultado con la de
 * la tarifa, así que con una tarifa de 1800 MXN y visualización en USD (el
 * default) pedía cobrar 109 y el backend facturaba 1982. Pidiendo las tasas acá
 * adentro, quien lo use ya no puede elegir mal la moneda.
 *
 * Devuelve `null` mientras falte alguna tasa, para que la UI muestre que está
 * calculando en vez de un número incompleto.
 */
export const useBilledTotal = ({
  tariff,
  costs,
  costsCurrency,
  discount = 0,
  discountCurrency,
}: BilledTotalInput): number | null => {
  const billingCurrency = tariff?.currency ?? null;

  // Sin importe no hace falta tasa: cero convertido sigue siendo cero, y pedirla
  // igual sería una llamada por cada card que todavía no tiene extras.
  const needsCosts =
    billingCurrency !== null && costs > 0 && costsCurrency !== billingCurrency;
  const { exchangeRate: costsExchange } = useExchangeRate({
    from: costsCurrency,
    to: billingCurrency ?? costsCurrency,
    enabled: needsCosts,
  });

  const discountFrom = discountCurrency ?? billingCurrency ?? costsCurrency;
  const needsDiscount =
    billingCurrency !== null && discount > 0 && discountFrom !== billingCurrency;
  const { exchangeRate: discountExchange } = useExchangeRate({
    from: discountFrom,
    to: billingCurrency ?? discountFrom,
    enabled: needsDiscount,
  });

  if (!tariff) return null;

  const costsRate = needsCosts ? (costsExchange?.rate ?? null) : 1;
  const discountRate = needsDiscount ? (discountExchange?.rate ?? null) : 1;
  if (costsRate === null || discountRate === null) return null;

  // Piso en cero igual que el dominio: `Money` rechaza importes negativos, así
  // que un descuento mayor que la cuenta factura cero, no una deuda al revés.
  return Math.max(
    0,
    tariff.amount + costs * costsRate - discount * discountRate,
  );
};
