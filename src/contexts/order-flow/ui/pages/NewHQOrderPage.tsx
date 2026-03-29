import { Button } from "@contexts/shared/shadcn";
import { ArrowLeft } from "lucide-react";
import { FormProvider } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useHQOrderFlow } from "../hooks/useHQOrderFlow";
import { HQContactStep } from "../components/contact/HQContactStep";
import { HQPackageStep } from "../components/package/HQPackageStep";
import { RateStep } from "../components/rate/RateStep";
import { OrderSuccessView } from "../components/order/OrderSuccessView";
import { StepIndicator } from "../components/StepIndicator";
import type { NewOrderFormValues } from "../../domain/schemas/NewOrderForm";
import type { MoneyPrimitives } from "@contexts/shared/domain/schemas/Money";

interface NewHQOrderPageProps {
  initialValues?: NewOrderFormValues;
  orderId?: string;
  partnerPrice?: MoneyPrimitives | null;
  storeName?: string;
  partnerOrderNumber?: string;
}

export const NewHQOrderPage = ({ initialValues, orderId, partnerPrice, storeName, partnerOrderNumber }: NewHQOrderPageProps = {}) => {
  const navigate = useNavigate();
  const flow = useHQOrderFlow({ initialValues, orderId });

  const title = (() => {
    const action = flow.isEditing ? "Editar Orden JBG" : "Nueva Orden JBG";
    if (storeName) {
      const partnerRef = partnerOrderNumber ? ` (#${partnerOrderNumber})` : "";
      return `${action} — Partner: ${storeName}${partnerRef}`;
    }
    return action;
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      {flow.step !== "success" && (
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={flow.step === "contact" ? flow.goToOrders : flow.handleBack}
          >
            <ArrowLeft className="size-5" />
          </Button>
          <h1 className="text-2xl font-bold">
            {title}
          </h1>
        </div>
      )}

      {/* Step Indicator */}
      <StepIndicator
        steps={flow.steps}
        currentStep={flow.step}
        onStepClick={flow.setStep}
      />

      {/* Form */}
      <FormProvider {...flow.form}>
        {flow.step === "contact" && <HQContactStep />}

        {flow.step === "package" && (
          <HQPackageStep onEditContacts={() => flow.setStep("contact")} />
        )}

        {flow.step === "rate" && (
          <RateStep
            rates={flow.rates}
            isLoadingRates={flow.isLoadingRates}
            ratesError={flow.ratesError}
            onRefetch={flow.refetchRates}
            onSubmit={flow.selectAndFulfill}
            onBack={flow.handleBack}
            isSubmitting={flow.isSelectingProvider}
            fulfilledShipment={flow.fulfilledShipment}
            onFinish={flow.goToOrders}
            onCreateAnother={() => navigate("/orders/new/hq")}
            partnerPrice={partnerPrice}
          />
        )}

        {flow.step === "success" && flow.fulfilledShipment && (
          <OrderSuccessView
            shipment={flow.fulfilledShipment}
            invoiceId={flow.invoiceId}
            onFinish={flow.goToOrders}
            onCreateAnother={() => navigate("/orders/new/hq")}
          />
        )}
      </FormProvider>

      {/* Bottom Navigation */}
      {flow.step !== "rate" && flow.step !== "success" && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={flow.step === "contact" ? flow.goToOrders : flow.handleBack}>
            {flow.step === "contact" ? "Cancelar" : "Anterior"}
          </Button>
          <Button disabled={flow.isNextDisabled} onClick={flow.handleNext}>
            {flow.nextButtonLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
