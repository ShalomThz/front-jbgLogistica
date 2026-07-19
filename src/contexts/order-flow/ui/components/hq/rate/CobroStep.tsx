import type { MoneyPrimitives } from "@contexts/shared/domain/schemas/Money";
import type { AddPaymentRequest } from "@contexts/sales/application/order/AddPaymentRequest";
import { SignatureCard } from "../../shared/SignatureCard";
import { AdditionalCostsCard } from "./AdditionalCostsCard";
import { OrderTotalCard } from "./OrderTotalCard";

interface CobroStepProps {
  onSubmit: () => void;
  isSubmitting: boolean;
  tariff: MoneyPrimitives | null;
  orderId?: string;
  /** Abonos capturados en este paso (locales; se suben al finalizar). */
  pendingPayments: AddPaymentRequest[];
  onAddPayment: (data: AddPaymentRequest) => void;
  onRemovePayment: (index: number) => void;
  onClearPayments: () => void;
}

export function CobroStep({
  onSubmit,
  isSubmitting,
  tariff,
  orderId,
  pendingPayments,
  onAddPayment,
  onRemovePayment,
  onClearPayments,
}: CobroStepProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 lg:items-start gap-6 flex-1 min-h-0 overflow-auto p-2">
      <div className="lg:col-span-2 space-y-4">
        <AdditionalCostsCard />
        <SignatureCard />
      </div>

      <div className="space-y-4 lg:sticky lg:top-0">
        <OrderTotalCard
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          disabled={!tariff}
          orderId={orderId}
          pendingPayments={pendingPayments}
          onAddPayment={onAddPayment}
          onRemovePayment={onRemovePayment}
          onClearPayments={onClearPayments}
        />
      </div>
    </div>
  );
}
