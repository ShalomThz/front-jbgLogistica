import { Button } from "@contexts/shared/shadcn";
import { ArrowLeft, Check } from "lucide-react";
import { FormProvider, useWatch } from "react-hook-form";
import { useNewOrderForm, type OrderStep } from "../hooks/useNewOrderForm";
import { useNewOrderSubmission } from "../hooks/useNewOrderSubmission";
import { ContactStep } from "../components/contact/ContactStep";
import { PackageStep } from "../components/package/PackageStep";
import { RateStep } from "../components/rate/RateStep";
import type { NewOrderFormValues } from "../../domain/schemas/NewOrderForm";

const STEPS: { key: OrderStep; label: string }[] = [
  { key: "contact", label: "Contactos" },
  { key: "package", label: "Paquete" },
  { key: "rate", label: "Cotización" },
];

interface NewOrderPageProps {
  initialValues?: NewOrderFormValues;
  orderId?: string;
}

export const NewOrderPage = ({ initialValues, orderId }: NewOrderPageProps = {}) => {
  const { form, step, setStep, shipmentId, setShipmentId, validateStep } = useNewOrderForm({ initialValues });

  const submission = useNewOrderSubmission({
    form,
    shipmentId,
    step,
    setShipmentId,
    setStep,
  });

  const orderType = useWatch({ control: form.control, name: "orderType" });

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  const handleNext = async () => {
    if (step === "contact") {
      const valid = await validateStep("contact");
      if (!valid) return;
      setStep("package");
    } else if (step === "package") {
      const valid = await validateStep("package");
      if (!valid) return;
      if (orderType === "PARTNER") {
        submission.handleCreatePartnerOrder();
      } else {
        submission.handleCreateOrderAndQuote();
      }
    }
  };

  const handleBack = () => {
    if (step === "package") setStep("contact");
    else if (step === "rate") setStep("package");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={step === "contact" ? () => submission.navigate("/orders") : handleBack}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="text-2xl font-bold">{orderId ? "Editar Orden" : "Nueva Orden"}</h1>
      </div>

      {/* Step Indicator */}
      <nav className="flex items-center gap-2">
        {STEPS.map((s, i) => {
          const isCompleted = i < stepIndex;
          const isCurrent = s.key === step;
          const isClickable = isCompleted;

          return (
            <div key={s.key} className="flex items-center gap-2">
              {i > 0 && (
                <div className={`h-px w-8 ${isCompleted ? "bg-primary" : "bg-border"}`} />
              )}
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && setStep(s.key)}
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
      <FormProvider {...form}>
        {step === "contact" && <ContactStep />}

        {step === "package" && (
          <PackageStep onEditContacts={() => setStep("contact")} />
        )}

        {step === "rate" && (
          <RateStep
            rates={submission.rates}
            isLoadingRates={submission.isLoadingRates}
            ratesError={submission.ratesError}
            onSubmit={submission.handleSelectProviderAndFulfill}
            onBack={() => setStep("package")}
            isSubmitting={submission.isSelectingProvider}
            fulfilledShipment={submission.fulfilledShipment}
            onFinish={() => submission.navigate("/orders")}
          />
        )}
      </FormProvider>

      {/* Bottom Navigation */}
      {step !== "rate" && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={step === "contact" ? () => submission.navigate("/orders") : handleBack}>
            {step === "contact" ? "Cancelar" : "Anterior"}
          </Button>
          <Button disabled={submission.isCreating} onClick={handleNext}>
            {step === "contact" && "Siguiente"}
            {step === "package" &&
              orderType === "PARTNER" &&
              (submission.isCreating ? "Creando..." : "Crear Orden")}
            {step === "package" && orderType === "HQ" && (submission.isCreating ? "Cotizando..." : "Cotizar")}
          </Button>
        </div>
      )}
    </div>
  );
};
