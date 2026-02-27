import { useState } from "react";
import type { NewOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";
import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { useQuery } from "@tanstack/react-query";
import { storeRepository } from "@contexts/iam/infrastructure/services/stores/storeRepository";
import { useTariffPrice } from "@contexts/pricing/infrastructure/hooks/tariffs/useTariffPrice";
import { usePartnerOrderFlowForm, type PartnerOrderStep } from "./usePartnerOrderFlowForm";
import { useContactSave } from "./useContactSave";
import { useBoxOperations } from "./useBoxOperations";
import { usePartnerOrderSubmission } from "./usePartnerOrderSubmission";

const STEPS: { key: PartnerOrderStep; label: string }[] = [
  { key: "contact", label: "Contactos" },
  { key: "package", label: "Paquete" },
  { key: "pricing", label: "Costos" },
];

interface UsePartnerOrderFlowOptions {
  initialValues?: NewOrderFormValues;
  orderId?: string;
}

export const usePartnerOrderFlow = ({ initialValues, orderId }: UsePartnerOrderFlowOptions = {}) => {
  const [step, setStep] = useState<PartnerOrderStep>("contact");

  const { form, validateStep } = usePartnerOrderFlowForm({ initialValues });
  const { saveContacts, isSaving } = useContactSave({ form });
  const { processBox, isProcessing: isProcessingBox } = useBoxOperations({ form, initialValues, enabled: step !== "contact" });
  const submission = usePartnerOrderSubmission({ form, initialOrderId: orderId });
  const { user } = useAuth();

  const { data: store } = useQuery({
    queryKey: ["stores", user?.storeId],
    queryFn: () => storeRepository.getById(user!.storeId),
    enabled: !!user?.storeId,
  });

  const destinationCountry = form.watch("recipient.address.country");
  const boxId = form.watch("package.boxId");

  const { tariffPrice, isLoadingPrice, priceError, refetchPrice } = useTariffPrice({
    zoneId: store?.zone?.id ?? "",
    destinationCountry,
    boxId: boxId ?? "",
    enabled: step === "pricing" && !!store?.zone?.id && !!destinationCountry && !!boxId,
  });

  const isEditing = !!submission.orderId;
  const stepIndex = STEPS.findIndex((s) => s.key === step);

  const handleNext = async () => {
    if (step === "contact") {
      if (!(await validateStep("contact"))) return;
      if (!(await saveContacts())) return;
      setStep("package");
    } else if (step === "package") {
      if (!(await validateStep("package"))) return;
      if (!(await processBox())) return;
      setStep("pricing");
    } else if (step === "pricing") {
      await submission.submitPartnerOrder();
    }
  };

  const handleBack = () => {
    if (step === "package") setStep("contact");
    else if (step === "pricing") setStep("package");
  };

  const nextButtonLabel = (() => {
    if (step === "contact") return isSaving ? "Guardando..." : "Siguiente";
    if (step === "package") return "Siguiente";
    if (submission.isCreating) return isEditing ? "Actualizando..." : "Creando...";
    return isEditing ? "Actualizar Orden" : "Crear Orden";
  })();

  const isNextDisabled = submission.isCreating || isSaving || isProcessingBox;

  return {
    form,
    step,
    stepIndex,
    steps: STEPS,
    setStep,
    handleNext,
    handleBack,
    goToOrders: submission.goToOrders,
    isEditing,
    nextButtonLabel,
    isNextDisabled,
    tariffPrice,
    isLoadingPrice,
    tariffError: priceError,
    refetchPrice,
  };
};
