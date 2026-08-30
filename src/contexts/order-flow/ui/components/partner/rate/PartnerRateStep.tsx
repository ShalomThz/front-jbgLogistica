import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@contexts/shared/shadcn";
import type { MoneyPrimitives } from "@contexts/shared/domain/schemas/Money";
import type { QuotePriceResponse } from "@contexts/pricing/application/QuotePrice";
import type { AddPaymentRequest } from "@contexts/sales/application/order/AddPaymentRequest";
import { ZoneSelector } from "@contexts/pricing/ui/components/zone/ZoneSelector";
import { DestinationCountrySelector } from "../../shared/DestinationCountrySelector";
import { PartnerOrderSummaryCard } from "../pricing/PartnerOrderSummaryCard";
import { PartnerAdditionalCostsCard } from "./PartnerAdditionalCostsCard";
import { PartnerRateTable } from "./PartnerRateTable";
import { PartnerTotalCard } from "./PartnerTotalCard";

interface PartnerRateStepProps {
  /** Los servicios tarifados para esta caja y este destino. */
  options: QuotePriceResponse[];
  isLoadingOptions: boolean;
  optionsError: string | null;
  refetchOptions: () => void;
  /** El renglón elegido; `null` si el precio se escribió a mano. */
  selectedTariffId: string | null;
  onSelectOption: (option: QuotePriceResponse) => void;
  onClearSelection: () => void;

  /** El precio que se va a cobrar: el de la fila elegida o el escrito a mano. */
  effectiveTariff: MoneyPrimitives | null;
  onTariffChange: (value: MoneyPrimitives) => void;
  /** El monto se escribió a mano. No es lo mismo que "no hay fila elegida":
   * se puede ajustar el precio de una fila sin dejar de tenerla elegida. */
  isManualTariff: boolean;

  pendingPayments: AddPaymentRequest[];
  onAddPayment: (data: AddPaymentRequest) => void;
  onRemovePayment: (index: number) => void;
  onClearPayments: () => void;
  orderId?: string;

  /** Ejes fijos de la consulta: cambiarlos vuelve a pedir el menú. */
  zoneId?: string;
  onZoneChange?: (zoneId: string) => void;
  destinationCountry: string;
  onDestinationCountryChange: (country: string) => void;
  recipientCountry: string;

  /** `CAN_VIEW_ORDER_FINANCIALS`. El agente no lo tiene. */
  canViewFinancials: boolean;
}

/**
 * Lo que el socio le paga a JBG: qué servicio contrata, a qué precio, con qué
 * costos y cuánto lleva abonado.
 *
 * Está separado del paso de cobro porque son dos relaciones de plata distintas.
 * Mezclarlas en una pantalla obligaba a distinguirlas con etiquetas —"Tarifa
 * JBG", "Total a pagar a JBG"— y aun así se leían como un solo total.
 */
export function PartnerRateStep({
  options,
  isLoadingOptions,
  optionsError,
  refetchOptions,
  selectedTariffId,
  onSelectOption,
  onClearSelection,
  effectiveTariff,
  onTariffChange,
  isManualTariff,
  pendingPayments,
  onAddPayment,
  onRemovePayment,
  onClearPayments,
  orderId,
  zoneId,
  onZoneChange,
  destinationCountry,
  onDestinationCountryChange,
  recipientCountry,
  canViewFinancials,
}: PartnerRateStepProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        {/* Los dos ejes que no se eligen de una lista. Ojo con la zona: es la
            del **punto de recolección**, no la del destino. JBG va a buscar el
            paquete a la tienda del socio, lo lleva a su bodega y desde ahí lo
            despacha; el precio se cobra por ir a buscarlo, así que la zona es
            de dónde sale. El servicio y el modo sí se eligen, y por eso son
            filas de la tabla. */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recolección y destino</CardTitle>
            <CardDescription>
              La zona es dónde JBG recoge el paquete, y es lo que determina el
              precio. El país es a dónde se envía después.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 pt-0 md:grid-cols-2">
            {onZoneChange && (
              <ZoneSelector
                zoneId={zoneId}
                onZoneChange={onZoneChange}
                label="Zona de recolección"
              />
            )}
            <DestinationCountrySelector
              value={destinationCountry}
              onChange={onDestinationCountryChange}
              recipientCountry={recipientCountry}
            />
          </CardContent>
        </Card>

        <PartnerRateTable
          options={options}
          isLoading={isLoadingOptions}
          error={optionsError}
          selectedTariffId={selectedTariffId}
          onSelect={onSelectOption}
          onRefetch={refetchOptions}
          onClearSelection={onClearSelection}
        />

        <PartnerAdditionalCostsCard />
      </div>

      <div className="space-y-4">
        <PartnerOrderSummaryCard />
        {/* La tarifa se corrige acá, en su propia línea del desglose: el monto
            se edita donde se lee y el efecto en el total queda a la vista. */}
        <PartnerTotalCard
          tariffPrice={effectiveTariff}
          onTariffChange={onTariffChange}
          isManualTariff={isManualTariff}
          orderId={orderId}
          pendingPayments={pendingPayments}
          onAddPayment={onAddPayment}
          onRemovePayment={onRemovePayment}
          onClearPayments={onClearPayments}
          canViewFinancials={canViewFinancials}
        />
      </div>
    </div>
  );
}
