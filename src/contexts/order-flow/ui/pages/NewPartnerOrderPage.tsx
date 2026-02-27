import { Button } from "@contexts/shared/shadcn";
import { ArrowLeft } from "lucide-react";
import { FormProvider } from "react-hook-form";
import { usePartnerOrderFlow } from "../hooks/usePartnerOrderFlow";
import { PartnerContactStep } from "../components/contact/PartnerContactStep";
import { PartnerPackageStep } from "../components/package/PartnerPackageStep";
import { PartnerPricingStep } from "../components/partner/PartnerPricingStep";
import { StepIndicator } from "../components/StepIndicator";
import type { NewOrderFormValues } from "../../domain/schemas/NewOrderForm";

interface NewPartnerOrderPageProps {
  initialValues?: NewOrderFormValues;
  orderId?: string;
}

export const NewPartnerOrderPage = ({ initialValues, orderId }: NewPartnerOrderPageProps = {}) => {
  const flow = usePartnerOrderFlow({ initialValues, orderId });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={flow.step === "contact" ? flow.goToOrders : flow.handleBack}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="text-2xl font-bold">
          {flow.isEditing ? "Editar Orden Partner" : "Nueva Orden Partner"}
        </h1>
      </div>

      {/* Step Indicator */}
      <StepIndicator
        steps={flow.steps}
        currentStep={flow.step}
        onStepClick={flow.setStep}
      />

      {/* Form */}
      <FormProvider {...flow.form}>
        {flow.step === "contact" && <PartnerContactStep />}

        {flow.step === "package" && (
          <PartnerPackageStep onEditContacts={() => flow.setStep("contact")} />
        )}

        {flow.step === "pricing" && (
          <PartnerPricingStep
            tariffPrice={flow.tariffPrice}
            isLoadingPrice={flow.isLoadingPrice}
            tariffError={flow.tariffError}
            refetchPrice={flow.refetchPrice}
          />
        )}
      </FormProvider>

      {/* Bottom Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={flow.step === "contact" ? flow.goToOrders : flow.handleBack}>
          {flow.step === "contact" ? "Cancelar" : "Anterior"}
        </Button>
        <Button disabled={flow.isNextDisabled} onClick={flow.handleNext}>
          {flow.nextButtonLabel}
        </Button>
      </div>
    </div>
  );
};
