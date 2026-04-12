import { useState } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";
import type { HQOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";
import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { orderPolicies } from "@contexts/shared/domain/policies/order.policy";
import { useHQOrderFlowForm, type HQOrderStep } from "./useHQOrderFlowForm";
import { useContactSave } from "../shared/useContactSave";
import { useBoxOperations } from "../shared/useBoxOperations";
import { useHQOrderSubmission } from "./useHQOrderSubmission";

const STEPS: { key: HQOrderStep; label: string }[] = [
  { key: "contact", label: "Contactos" },
  { key: "package", label: "Paquete" },
  { key: "rate", label: "Cotización" },
  { key: "success", label: "Listo" },
];

interface UseHQOrderFlowOptions {
  initialValues?: HQOrderFormValues;
  orderId?: string;
  storeId?: string;
}

export const useHQOrderFlow = ({ initialValues, orderId, storeId }: UseHQOrderFlowOptions = {}) => {
  const [step, setStep] = useState<HQOrderStep>("contact");
  const { user } = useAuth();

  const canSelectStore = user ? orderPolicies.createHQ(user) : false;
  const [selectedStoreId, setSelectedStoreId] = useState<string | undefined>(storeId ?? user?.storeId);

  const { form, validateStep } = useHQOrderFlowForm({ initialValues });
  const formAsFieldValues = form as unknown as UseFormReturn<FieldValues, any, any>;
  const { saveContacts, isSaving } = useContactSave({ form: formAsFieldValues });
  const { processBox, boxes, updateBox, isProcessing: isProcessingBox } = useBoxOperations({ form: formAsFieldValues, initialValues, enabled: step !== "contact" });
  const submission = useHQOrderSubmission({ form, step, setStep, initialOrderId: orderId, boxes, updateBox, storeId: selectedStoreId });

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
      if (!(await form.trigger())) return;
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
    invoiceId: submission.invoiceId,
    canSelectStore,
    selectedStoreId,
    setSelectedStoreId,
  };
};
