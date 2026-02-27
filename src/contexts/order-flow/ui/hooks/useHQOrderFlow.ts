import { useState } from "react";
import type { NewOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";
import { useHQOrderFlowForm, type HQOrderStep } from "./useHQOrderFlowForm";
import { useContactSave } from "./useContactSave";
import { useBoxOperations } from "./useBoxOperations";
import { useHQOrderSubmission } from "./useHQOrderSubmission";

const STEPS: { key: HQOrderStep; label: string }[] = [
  { key: "contact", label: "Contactos" },
  { key: "package", label: "Paquete" },
  { key: "rate", label: "Cotización" },
];

interface UseHQOrderFlowOptions {
  initialValues?: NewOrderFormValues;
  orderId?: string;
}

export const useHQOrderFlow = ({ initialValues, orderId }: UseHQOrderFlowOptions = {}) => {
  const [step, setStep] = useState<HQOrderStep>("contact");

  const { form, validateStep } = useHQOrderFlowForm({ initialValues });
  const { saveContacts, isSaving } = useContactSave({ form });
  const { processBox, boxes, updateBox, isProcessing: isProcessingBox } = useBoxOperations({ form, initialValues, enabled: step !== "contact" });
  const submission = useHQOrderSubmission({ form, step, setStep, initialOrderId: orderId, boxes, updateBox });

  const isEditing = !!submission.orderId;
  const stepIndex = STEPS.findIndex((s) => s.key === step);

  const navigateToStep = (target: HQOrderStep) => {
    if (target === "package") submission.clearRateData();
    setStep(target);
  };

  const handleNext = async () => {
    if (step === "contact") {
      if (!(await validateStep("contact"))) return;
      if (!(await saveContacts())) return;
      setStep("package");
    } else if (step === "package") {
      if (!(await validateStep("package"))) return;
      if (!(await processBox())) return;
      await submission.submitHQOrder();
    }
  };

  const handleBack = () => {
    if (step === "package") setStep("contact");
    else if (step === "rate") navigateToStep("package");
  };

  const nextButtonLabel = (() => {
    if (step === "contact") return isSaving ? "Guardando..." : "Siguiente";
    return submission.isCreating ? "Cotizando..." : "Cotizar";
  })();

  const isNextDisabled = submission.isCreating || isSaving || isProcessingBox;

  return {
    form,
    step,
    stepIndex,
    steps: STEPS,
    setStep: navigateToStep,
    handleNext,
    handleBack,
    goToOrders: submission.goToOrders,
    isEditing,
    nextButtonLabel,
    isNextDisabled,
    rates: submission.rates,
    isLoadingRates: submission.isLoadingRates,
    ratesError: submission.ratesError,
    refetchRates: submission.refetchRates,
    selectAndFulfill: submission.selectAndFulfill,
    isSelectingProvider: submission.isSelectingProvider,
    fulfilledShipment: submission.fulfilledShipment,
  };
};
