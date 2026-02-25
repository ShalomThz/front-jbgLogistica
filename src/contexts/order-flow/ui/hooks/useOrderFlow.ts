import { useState } from "react";
import type { NewOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";
import { useOrderFlowForm, type OrderStep } from "./useOrderFlowForm";
import { useContactSave } from "./useContactSave";
import { useBoxOperations } from "./useBoxOperations";
import { useOrderSubmission } from "./useOrderSubmission";

const STEPS: { key: OrderStep; label: string }[] = [
  { key: "contact", label: "Contactos" },
  { key: "package", label: "Paquete" },
  { key: "rate", label: "Cotización" },
];

interface UseOrderFlowOptions {
  initialValues?: NewOrderFormValues;
  orderId?: string;
}

export const useOrderFlow = ({ initialValues, orderId }: UseOrderFlowOptions = {}) => {
  const [step, setStep] = useState<OrderStep>("contact");

  const { form, validateStep } = useOrderFlowForm({ initialValues });
  const { saveContacts, isSaving } = useContactSave({ form });
  const { processBox, boxes, updateBox, isProcessing: isProcessingBox } = useBoxOperations({ form, initialValues, enabled: step !== "contact" });
  const submission = useOrderSubmission({ form, step, setStep, initialOrderId: orderId, boxes, updateBox });

  const orderType = form.watch("orderType");
  const isEditing = !!submission.orderId;
  const stepIndex = STEPS.findIndex((s) => s.key === step);

  const navigateToStep = (target: OrderStep) => {
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
      if (orderType === "PARTNER") await submission.submitPartnerOrder();
      else await submission.submitHQOrder();
    }
  };

  const handleBack = () => {
    if (step === "package") setStep("contact");
    else if (step === "rate") navigateToStep("package");
  };

  const nextButtonLabel = (() => {
    if (step === "contact") return isSaving ? "Guardando..." : "Siguiente";
    if (orderType === "PARTNER") {
      if (submission.isCreating) return isEditing ? "Actualizando..." : "Creando...";
      return isEditing ? "Actualizar Orden" : "Crear Orden";
    }
    return submission.isCreating ? "Cotizando..." : "Cotizar";
  })();

  const isNextDisabled = submission.isCreating || isSaving || isProcessingBox;

  return {
    // Form
    form,
    // Navigation
    step,
    stepIndex,
    steps: STEPS,
    setStep: navigateToStep,
    handleNext,
    handleBack,
    goToOrders: submission.goToOrders,
    // UI state
    isEditing,
    nextButtonLabel,
    isNextDisabled,
    // Rate step
    rates: submission.rates,
    isLoadingRates: submission.isLoadingRates,
    ratesError: submission.ratesError,
    refetchRates: submission.refetchRates,
    selectAndFulfill: submission.selectAndFulfill,
    isSelectingProvider: submission.isSelectingProvider,
    fulfilledShipment: submission.fulfilledShipment,
  };
};
