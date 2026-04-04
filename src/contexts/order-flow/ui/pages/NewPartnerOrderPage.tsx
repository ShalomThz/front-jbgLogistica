import { Button } from "@contexts/shared/shadcn";
import { ArrowLeft, CheckCircle2, Plus } from "lucide-react";
import { FormProvider } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { usePartnerOrderFlow } from "../hooks/partner/usePartnerOrderFlow";
import { useStores } from "@contexts/iam/infrastructure/hooks/stores/useStores";
import { PartnerContactStep } from "../components/contact/PartnerContactStep";
import { PartnerPackageStep } from "../components/package/PartnerPackageStep";
import { PartnerPricingStep } from "../components/partner/PartnerPricingStep";
import { StepIndicator } from "../components/StepIndicator";
import type { PartnerOrderFormValues } from "../../domain/schemas/NewOrderForm";

interface NewPartnerOrderPageProps {
  initialValues?: PartnerOrderFormValues;
  orderId?: string;
  storeName?: string;
}

export const NewPartnerOrderPage = ({ initialValues, orderId, storeName }: NewPartnerOrderPageProps = {}) => {
  const navigate = useNavigate();
  const flow = usePartnerOrderFlow({ initialValues, orderId });
  const { stores } = useStores({ limit: 100 });

  const title = (() => {
    const action = flow.isEditing ? "Editar Orden" : "Nueva Orden";
    const name = storeName ?? stores?.find(s => s.id === flow.selectedStoreId)?.name;
    if (name) return `${action} — ${name}`;
    return `${action} Partner`;
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
        {flow.step === "contact" && (
          <PartnerContactStep
            {...(flow.canSelectStore && {
              stores,
              selectedStoreId: flow.selectedStoreId,
              onStoreChange: flow.setSelectedStoreId,
            })}
          />
        )}

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

        {flow.step === "success" && (
          <div className="mx-auto max-w-2xl space-y-6">
            <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center dark:border-green-800 dark:bg-green-950/30">
              <CheckCircle2 className="mx-auto size-12 text-green-600" />
              <h2 className="mt-3 text-xl font-bold text-green-700 dark:text-green-400">
                Orden creada exitosamente
              </h2>
              <p className="mt-1 text-sm text-green-600/80 dark:text-green-400/70">
                La orden ha sido registrada y está pendiente de procesamiento
              </p>
            </div>
            <div className="flex justify-between gap-3">
              <Button variant="outline" className="gap-2" onClick={() => navigate("/orders/new/partner")}>
                <Plus className="size-4" />
                Crear otra orden
              </Button>
              <Button onClick={flow.goToOrders}>
                Ir a órdenes
              </Button>
            </div>
          </div>
        )}
      </FormProvider>

      {/* Bottom Navigation */}
      {flow.step !== "success" && (
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
