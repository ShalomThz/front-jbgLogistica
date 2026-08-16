import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { useQuery } from "@tanstack/react-query";
import { storeRepository } from "@contexts/iam/infrastructure/services/stores/storeRepository";
import type { PartnerOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";
import { useQuotePrice } from "@contexts/pricing/infrastructure/hooks/tariffs/useQuotePrice";
import { PickupPoints } from "@contexts/pricing/application/QuotePrice";
import type { ServiceLevel } from "@contexts/pricing/domain/schemas/tariff/Tariff";
import { orderPolicies } from "@contexts/shared/domain/policies/order.policy";
import type { MoneyPrimitives } from "@contexts/shared/domain/schemas/Money";
import { useState } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";
import { useBoxOperations } from "../shared/useBoxOperations";
import { useContactSave } from "../shared/useContactSave";
import { usePartnerOrderFlowForm, type PartnerOrderStep } from "./usePartnerOrderFlowForm";
import { usePartnerOrderSubmission } from "./usePartnerOrderSubmission";

const STEPS: { key: PartnerOrderStep; label: string }[] = [
  { key: "contact", label: "Contactos" },
  { key: "package", label: "Paquete" },
  { key: "pricing", label: "Costos" },
  { key: "success", label: "Listo" },
];

interface UsePartnerOrderFlowOptions {
  initialValues?: PartnerOrderFormValues;
  orderId?: string;
  storeId?: string;
}

export const usePartnerOrderFlow = ({ initialValues, orderId, storeId }: UsePartnerOrderFlowOptions = {}) => {
  const [step, setStep] = useState<PartnerOrderStep>("contact");
  const { user } = useAuth();

  const canSelectStore = user ? orderPolicies.changeStore(user) : false;

  const [selectedStoreId, setSelectedStoreId] = useState<string | undefined>(storeId ?? user?.store.id);

  const canChangeZone = user ? orderPolicies.changeZone(user) : false;
  // undefined = usar la zona de la tienda seleccionada
  const [zoneOverrideId, setZoneOverrideId] = useState<string | undefined>(undefined);

  const handleStoreChange = (id: string) => {
    setSelectedStoreId(id);
    // La zona elegida pertenecía a la tienda anterior — volver al default
    setZoneOverrideId(undefined);
  };

  const { form, validateStep } = usePartnerOrderFlowForm({ initialValues });
  const formAsFieldValues = form as unknown as UseFormReturn<FieldValues, any, any>;
  const { saveContacts, isSaving } = useContactSave({ form: formAsFieldValues });
  const { processBox, isProcessing: isProcessingBox } = useBoxOperations({ form: formAsFieldValues, initialValues, enabled: step !== "contact" });

  const activeStoreId = selectedStoreId ?? user?.store.id;

  const { data: store } = useQuery({
    queryKey: ["stores", activeStoreId],
    queryFn: () => storeRepository.getById(activeStoreId!),
    enabled: !!activeStoreId,
  });

  const boxId = form.watch("package.boxId");

  const effectiveZoneId = zoneOverrideId ?? store?.zone?.id;

  // Una orden de socio se recoge en la tienda socia y se cobra a precio socio:
  // los dos salen del tipo de orden, no de una elección del usuario. Lo único
  // que se elige es la velocidad del servicio.
  const [serviceLevel, setServiceLevel] = useState<ServiceLevel>("STANDARD");

  // La zona override sigue siendo cosa del front: cambia contra qué zona se
  // cotiza sin mover dónde está la tienda.
  const pickup = zoneOverrideId
    ? PickupPoints.atCustomerAddress(zoneOverrideId)
    : activeStoreId
      ? PickupPoints.atPartnerStore(activeStoreId)
      : undefined;

  const { tariffPrice, isLoadingPrice, priceError, refetchPrice } = useQuotePrice({
    pickup,
    boxId: boxId ?? "",
    serviceLevel,
    priceType: "PARTNER",
    enabled: step === "pricing" && !!pickup && !!boxId,
  });

  // Lets the seller override the auto-fetched tariff (or type one in
  // manually when none was found for this zone/box/destination). Reset
  // whenever the underlying lookup inputs change — a price typed for a
  // different combination no longer applies. Adjusted during render (not in
  // an effect) to avoid the extra render pass.
  const tariffLookupKey = `${effectiveZoneId ?? ""}|${serviceLevel}|${boxId ?? ""}`;
  const [tariffOverride, setTariffOverride] = useState<MoneyPrimitives | null>(null);
  const [lastTariffLookupKey, setLastTariffLookupKey] = useState(tariffLookupKey);
  if (tariffLookupKey !== lastTariffLookupKey) {
    setLastTariffLookupKey(tariffLookupKey);
    setTariffOverride(null);
  }

  const effectiveTariff = tariffOverride ?? tariffPrice;

  const submission = usePartnerOrderSubmission({ form, initialOrderId: orderId, storeId: selectedStoreId, tariff: effectiveTariff, serviceLevel, onSuccess: () => setStep("success") });

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
      if (!(await validateStep("pricing"))) return;
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

  const isNextDisabled =
    submission.isCreating ||
    isSaving ||
    isProcessingBox ||
    (step === "pricing" &&
      (isLoadingPrice || !effectiveTariff || effectiveTariff.amount <= 0));

  return {
    form,
    step,
    stepIndex,
    steps: STEPS,
    setStep,
    handleNext,
    handleBack,
    goToOrders: submission.goToOrders,
    orderId: submission.orderId,
    isEditing,
    nextButtonLabel,
    isNextDisabled,
    tariffPrice,
    effectiveTariff,
    onTariffChange: setTariffOverride,
    isLoadingPrice,
    tariffError: priceError,
    refetchPrice,
    canSelectStore,
    selectedStoreId,
    setSelectedStoreId: handleStoreChange,
    canChangeZone,
    setZoneOverride: setZoneOverrideId,
    originZoneId: effectiveZoneId,
    serviceLevel,
    setServiceLevel,
    pendingPayments: submission.pendingPayments,
    addPendingPayment: submission.addPendingPayment,
    removePendingPayment: submission.removePendingPayment,
    clearPendingPayments: submission.clearPendingPayments,
  };
};
