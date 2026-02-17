import { ExternalLink } from "lucide-react";
import type { ShipmentPrimitives } from "@contexts/shipping/domain/schemas/shipment/Shipment";
import type { MoneyPrimitives } from "@contexts/shared/domain/schemas/Money";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="col-span-2 text-sm">{value}</span>
    </div>
  );
}

function formatMoney(money: MoneyPrimitives) {
  return `$${money.amount.toFixed(2)} ${money.currency}`;
}

const CARRIER_TYPE_LABELS: Record<string, string> = {
  INTERNAL_FLEET: "Flota interna",
  THIRD_PARTY: "Tercero",
};

const COST_LABELS: Record<string, string> = {
  insurance: "Seguro",
  tools: "Herramientas",
  additionalCost: "Costo adicional",
  wrap: "Embalaje",
  tape: "Cinta",
};

interface OrderShipmentSectionProps {
  shipment: ShipmentPrimitives;
}

export const OrderShipmentSection = ({
  shipment,
}: OrderShipmentSectionProps) => {
  const { provider, rate, costBreakdown, finalPrice } = shipment;

  return (
    <div className="space-y-4">
      {provider && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Proveedor de envío</h4>
          <div className="rounded-md border p-3 space-y-1">
            <DetailRow label="Nombre" value={provider.providerName} />
            <DetailRow
              label="Tipo"
              value={CARRIER_TYPE_LABELS[provider.type] ?? provider.type}
            />
          </div>
        </div>
      )}

      {shipment.label && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Tracking</h4>
          <div className="rounded-md border p-3 space-y-1">
            <DetailRow label="N° Guía" value={shipment.label.trackingNumber} />
            <div className="grid grid-cols-3 gap-2">
              <span className="text-sm text-muted-foreground">Rastreo</span>
              <a
                href={shipment.label.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="col-span-2 text-sm text-primary underline inline-flex items-center gap-1"
              >
                Ver rastreo
                <ExternalLink className="size-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {rate && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Tarifa</h4>
          <div className="rounded-md border p-3 space-y-1">
            <DetailRow label="Servicio" value={rate.serviceName} />
            <DetailRow label="Precio" value={formatMoney(rate.price)} />
            <DetailRow label="Seguro" value={formatMoney(rate.insuranceFee)} />
            <DetailRow label="Ocurre" value={rate.isOcurre ? "Sí" : "No"} />
            {rate.estimatedDays != null && (
              <DetailRow
                label="Días estimados"
                value={`${rate.estimatedDays}`}
              />
            )}
          </div>
        </div>
      )}

      {costBreakdown && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Desglose de costos</h4>
          <div className="rounded-md border p-3 space-y-1">
            {Object.entries(costBreakdown).map(([key, value]) =>
              value ? (
                <DetailRow
                  key={key}
                  label={COST_LABELS[key] ?? key}
                  value={formatMoney(value)}
                />
              ) : null,
            )}
          </div>
        </div>
      )}

      {finalPrice && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Precio final</h4>
          <div className="rounded-md border p-3">
            <DetailRow label="Total" value={formatMoney(finalPrice)} />
          </div>
        </div>
      )}
    </div>
  );
};
