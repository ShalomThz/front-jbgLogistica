import { Button } from "@contexts/shared/shadcn";
import { ArrowLeft, Check } from "lucide-react";
import { FormProvider } from "react-hook-form";
import { useOrderFlow } from "../hooks/useOrderFlow";
import { ContactStep } from "../components/contact/ContactStep";
import { PackageStep } from "../components/package/PackageStep";
import { RateStep } from "../components/rate/RateStep";
import type { NewOrderFormValues } from "../../domain/schemas/NewOrderForm";

interface NewOrderPageProps {
  initialValues?: NewOrderFormValues;
  orderId?: string;
}

export const NewOrderPage = ({ initialValues, orderId }: NewOrderPageProps = {}) => {
  const flow = useOrderFlow({ initialValues, orderId });

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
          {flow.isEditing ? "Editar Orden" : "Nueva Orden"}
        </h1>
      </div>

      {/* Step Indicator */}
      <nav className="flex items-center gap-2">
        {flow.steps.map((s, i) => {
          const isCompleted = i < flow.stepIndex;
          const isCurrent = s.key === flow.step;
          const isClickable = isCompleted;

          return (
            <div key={s.key} className="flex items-center gap-2">
              {i > 0 && (
                <div className={`h-px w-8 ${isCompleted ? "bg-primary" : "bg-border"}`} />
              )}
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && flow.setStep(s.key)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  isCurrent
                    ? "bg-primary text-primary-foreground"
                    : isCompleted
                      ? "bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer"
                      : "bg-muted text-muted-foreground cursor-default"
                }`}
              >
                {isCompleted ? (
                  <Check className="size-3" />
                ) : (
                  <span>{i + 1}</span>
                )}
                {s.label}
              </button>
            </div>
          );
        })}
      </nav>

      {/* Form */}
      <FormProvider {...flow.form}>
        {flow.step === "contact" && <ContactStep />}

        {flow.step === "package" && (
          <PackageStep onEditContacts={() => flow.setStep("contact")} />
        )}

        {flow.step === "rate" && (
          <RateStep
            rates={flow.rates}
            isLoadingRates={flow.isLoadingRates}
            tariffNotFound={flow.tariffNotFound}
            ratesError={flow.ratesError}
            onRefetch={flow.refetchRates}
            onSubmit={flow.selectAndFulfill}
            onBack={flow.handleBack}
            isSubmitting={flow.isSelectingProvider}
            fulfilledShipment={flow.fulfilledShipment}
            onFinish={flow.goToOrders}
          />
        )}
      </FormProvider>

      {/* Bottom Navigation */}
      {flow.step !== "rate" && (
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
