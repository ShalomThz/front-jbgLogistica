import { Button } from "@contexts/shared/shadcn";
import { ArrowLeft, CheckCircle2, FilePlus2, Printer, UserPlus } from "lucide-react";
import { FormProvider } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { orderRepository } from "@contexts/sales/infrastructure/services/orders/orderRepository";
import {
  availableLabelOptionsByGroup,
  printLabel,
} from "@contexts/shipping/ui/labels/labelOptions";
import { usePartnerOrderFlow } from "../hooks/partner/usePartnerOrderFlow";
import { useStores } from "@contexts/iam/infrastructure/hooks/stores/useStores";
import { PartnerContactStep } from "../components/partner/contact/PartnerContactStep";
import { PartnerPackageStep } from "../components/partner/package/PartnerPackageStep";
import { PartnerPricingStep } from "../components/partner/pricing/PartnerPricingStep";
import { StepIndicator } from "../components/shared/StepIndicator";
import type { PartnerOrderFormValues } from "../../domain/schemas/NewOrderForm";

interface NewPartnerOrderPageProps {
  initialValues?: PartnerOrderFormValues;
  orderId?: string;
  storeName?: string;
  storeId?: string;
}

/**
 * La orden pidió "dejar caja vacía a domicilio": ofrece imprimir su etiqueta
 * apenas termina el flujo. El shipment se proyecta por evento, así que se
 * reintenta la consulta hasta que aparezca.
 */
function EmptyBoxLabelCard({ orderId }: { orderId: string }) {
  const [isPrinting, setIsPrinting] = useState(false);
  const { data: order } = useQuery({
    queryKey: ["orders", orderId],
    queryFn: () => orderRepository.findById(orderId),
    refetchInterval: (query) => (query.state.data?.shipment ? false : 1500),
  });

  const shipment = order?.shipment ?? null;
  const option =
    order && shipment
      ? availableLabelOptionsByGroup(shipment, order, "caja-vacia")[0]
      : undefined;

  const handlePrint = async () => {
    if (!shipment || !option) return;
    setIsPrinting(true);
    try {
      await printLabel(shipment, option.source);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
      <div>
        <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
          Caja vacía a domicilio
        </p>
        <p className="text-xs text-amber-600/80 dark:text-amber-400/70">
          Imprime la etiqueta y pégala en la caja que se dejará al cliente
        </p>
      </div>
      <Button
        variant="outline"
        className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-100 hover:text-amber-800 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/50"
        disabled={!option || isPrinting}
        onClick={handlePrint}
      >
        <Printer className="size-4" />
        {!shipment
          ? "Preparando etiqueta..."
          : isPrinting
            ? "Imprimiendo..."
            : "Imprimir etiqueta de caja vacía"}
      </Button>
    </div>
  );
}

export const NewPartnerOrderPage = (props: NewPartnerOrderPageProps = {}) => {
  const location = useLocation();
  const stateInitial = (location.state as { initialValues?: PartnerOrderFormValues } | null)?.initialValues;
  return (
    <NewPartnerOrderPageInner
      key={location.key}
      {...props}
      initialValues={props.initialValues ?? stateInitial}
    />
  );
};

const NewPartnerOrderPageInner = ({ initialValues, orderId, storeName, storeId }: NewPartnerOrderPageProps) => {
  const navigate = useNavigate();
  const flow = usePartnerOrderFlow({ initialValues, orderId, storeId });

  const selectedStoreFilters = useMemo(
    () =>
      flow.selectedStoreId && !storeName
        ? [{ field: "id", filterOperator: "=" as const, value: flow.selectedStoreId }]
        : [],
    [flow.selectedStoreId, storeName],
  );

  const { stores: selectedStoreLookup } = useStores({
    filters: selectedStoreFilters,
    enabled: !!flow.selectedStoreId && !storeName,
  });

  const handleCreateBlank = useCallback(() => {
    navigate("/orders/new/partner", { replace: true, state: null });
  }, [navigate]);

  const handleCreateSameClient = useCallback(() => {
    const values = flow.form.getValues();
    const cleaned: PartnerOrderFormValues = {
      ...values,
      orderData: {
        orderNumber: "",
        partnerOrderNumber: "",
      },
    };
    navigate("/orders/new/partner", { replace: true, state: { initialValues: cleaned } });
  }, [flow.form, navigate]);

  const title = (() => {
    const action = flow.isEditing ? "Editar Orden" : "Nueva Orden";
    const name = storeName ?? selectedStoreLookup[0]?.name;
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
            selectedStoreId={flow.selectedStoreId}
            {...(flow.canSelectStore && {
              onStoreChange: flow.setSelectedStoreId,
            })}
          />
        )}

        {flow.step === "package" && (
          <PartnerPackageStep
            onEditContacts={() => flow.setStep("contact")}
            originZoneId={flow.originZoneId}
            {...(flow.canChangeZone && { onZoneChange: flow.setZoneOverride })}
          />
        )}

        {flow.step === "pricing" && (
          <PartnerPricingStep
            tariffPrice={flow.tariffPrice}
            effectiveTariff={flow.effectiveTariff}
            onTariffChange={flow.onTariffChange}
            isLoadingPrice={flow.isLoadingPrice}
            tariffError={flow.tariffError}
            refetchPrice={flow.refetchPrice}
            pendingPayments={flow.pendingPayments}
            onAddPayment={flow.addPendingPayment}
            onRemovePayment={flow.removePendingPayment}
            onClearPayments={flow.clearPendingPayments}
            orderId={flow.orderId}
            zoneId={flow.originZoneId}
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
            {flow.form.getValues("emptyBoxDelivery") && flow.orderId && (
              <EmptyBoxLabelCard orderId={flow.orderId} />
            )}
            <div className="flex flex-wrap justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" className="gap-2" onClick={handleCreateBlank}>
                  <FilePlus2 className="size-4" />
                  Nueva orden en blanco
                </Button>
                <Button variant="outline" className="gap-2" onClick={handleCreateSameClient}>
                  <UserPlus className="size-4" />
                  Nueva orden del mismo cliente
                </Button>
              </div>
              <Button className="ml-auto" onClick={flow.goToOrders}>
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
