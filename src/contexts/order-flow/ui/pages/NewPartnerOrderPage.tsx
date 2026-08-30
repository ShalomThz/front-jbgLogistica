import { Button } from "@contexts/shared/shadcn";
import { ArrowLeft, Handshake, Printer } from "lucide-react";
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
import { PartnerRateStep } from "../components/partner/rate/PartnerRateStep";
import { PartnerOrderSuccessView } from "../components/partner/PartnerOrderSuccessView";
import { StepIndicator } from "../components/shared/StepIndicator";
import type { PartnerOrderFormValues } from "../../domain/schemas/NewOrderForm";
import type { OrderPricingPrimitives } from "@contexts/sales/domain/schemas/order/Order";

interface NewPartnerOrderPageProps {
  initialValues?: PartnerOrderFormValues;
  orderId?: string;
  storeName?: string;
  storeId?: string;
  /** Con qué se cotizó la orden que se está reabriendo, para que los
   * selectores de precio arranquen ahí y no en los defaults. */
  initialPricing?: OrderPricingPrimitives | null;
}

/**
 * La orden pidió una visita a domicilio (caja vacía o recolección): ofrece
 * imprimir su etiqueta con anticipo apenas termina el flujo. El shipment se
 * proyecta por evento, así que se reintenta la consulta hasta que aparezca.
 */
function AnticipoLabelCard({ orderId }: { orderId: string }) {
  const [isPrinting, setIsPrinting] = useState(false);
  const { data: order } = useQuery({
    queryKey: ["orders", orderId],
    queryFn: () => orderRepository.findById(orderId),
    refetchInterval: (query) => (query.state.data?.shipment ? false : 1500),
  });

  const shipment = order?.shipment ?? null;
  const option =
    order && shipment
      ? availableLabelOptionsByGroup(shipment, order, "anticipo")[0]
      : undefined;

  const isHomePickup = order?.homePickup ?? false;
  const title = isHomePickup ? "Recolección a domicilio" : "Caja vacía a domicilio";
  const hint = isHomePickup
    ? "Imprime la etiqueta y pégala en la caja que se recolectará"
    : "Imprime la etiqueta y pégala en la caja que se dejará al cliente";

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
          {title}
        </p>
        <p className="text-xs text-amber-600/80 dark:text-amber-400/70">
          {hint}
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
            : "Imprimir etiqueta con anticipo"}
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

const NewPartnerOrderPageInner = ({ initialValues, orderId, storeName, storeId, initialPricing }: NewPartnerOrderPageProps) => {
  const navigate = useNavigate();
  const flow = usePartnerOrderFlow({ initialValues, orderId, storeId, initialPricing });

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

  const title = flow.isEditing ? "Editar orden agente" : "Nueva orden agente";
  // El prop gana cuando viene (edición); si no, la que resolvió el flujo.
  const headerStore = storeName ?? flow.storeName ?? selectedStoreLookup[0]?.name;

  return (
    /* Tres capas. `h-full` para llenar el contenedor del layout, que ya viene
       acotado (`h-screen overflow-hidden` en DashboardLayout): sin eso la página
       crecería y el que scrollea sería el wrapper de afuera, moviendo el título
       y los botones junto con el contenido. */
    <div className="flex h-full flex-col gap-6">
      {/* ── Header: fijo ─────────────────────────────────────────────── */}
      {flow.step !== "success" && (
        <div className="flex shrink-0 items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={flow.step === "contact" ? flow.goToOrders : flow.handleBack}
          >
            <ArrowLeft className="size-5" />
          </Button>
          {/* El apretón de manos es el mismo que marca el precio de socio en la
              tabla de tarifas: acá dice de entrada que la orden es de un agente
              y no de mostrador. */}
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Handshake className="size-5" />
          </span>
          <h1 className="min-w-0 truncate text-2xl font-bold leading-tight">
            {title}
            {headerStore && (
              <>
                <span className="mx-2 font-normal text-muted-foreground">·</span>
                {/* La tienda resaltada dentro del título: es de quién es la
                    orden, y en esta pantalla hay dos partes cobrando. */}
                <span className="text-primary">{headerStore}</span>
              </>
            )}
          </h1>
        </div>
      )}

      <div className="shrink-0">
        <StepIndicator
          steps={flow.steps}
          currentStep={flow.step}
          onStepClick={flow.setStep}
        />
      </div>

      {/* ── Contenido: lo único que scrollea ─────────────────────────────
          `min-h-0` es lo que lo habilita: sin él un hijo flex no se encoge por
          debajo de su contenido y el overflow nunca se dispara. El `pr-1` deja
          la barra sin taparle el borde a las cards. */}
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
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
          <PartnerPackageStep onEditContacts={() => flow.setStep("contact")} />
        )}

        {/* Lo que el socio le paga a JBG. */}
        {flow.step === "rate" && (
          <PartnerRateStep
            options={flow.options}
            isLoadingOptions={flow.isLoadingOptions}
            optionsError={flow.optionsError}
            refetchOptions={flow.refetchOptions}
            selectedTariffId={flow.selectedTariffId}
            onSelectOption={flow.onSelectOption}
            onClearSelection={flow.onClearSelection}
            effectiveTariff={flow.effectiveTariff}
            onTariffChange={flow.onTariffChange}
            isManualTariff={flow.isManualTariff}
            pendingPayments={flow.pendingPayments}
            onAddPayment={flow.addPendingPayment}
            onRemovePayment={flow.removePendingPayment}
            onClearPayments={flow.clearPendingPayments}
            orderId={flow.orderId}
            zoneId={flow.originZoneId}
            {...(flow.canChangeZone && { onZoneChange: flow.setZoneOverride })}
            destinationCountry={flow.destinationCountry}
            onDestinationCountryChange={flow.setDestinationCountry}
            recipientCountry={flow.recipientCountry}
            canViewFinancials={flow.canViewFinancials}
          />
        )}

        {/* Lo que el socio le cobra a su cliente. */}
        {flow.step === "pricing" && (
          <PartnerPricingStep
            currency={flow.effectiveTariff?.currency ?? "USD"}
            storeName={headerStore ?? "—"}
            partnerSalePayments={flow.partnerSalePayments}
            onAddPartnerSalePayment={flow.addPartnerSalePayment}
            onRemovePartnerSalePayment={flow.removePartnerSalePayment}
            onClearPartnerSalePayments={flow.clearPartnerSalePayments}
            orderId={flow.orderId}
          />
        )}

        {flow.step === "success" && (
          <PartnerOrderSuccessView
            orderId={flow.orderId}
            canViewFinancials={flow.canViewFinancials}
            onCreateBlank={handleCreateBlank}
            onCreateSameClient={handleCreateSameClient}
            onFinish={flow.goToOrders}
          >
            {(flow.form.getValues("emptyBoxDelivery") ||
              flow.form.getValues("homePickup")) &&
              flow.orderId && <AnticipoLabelCard orderId={flow.orderId} />}
          </PartnerOrderSuccessView>
        )}
        </FormProvider>
      </div>

      {/* ── Pie: fijo. Antes había que bajar hasta el fondo del formulario
             para llegar a "Siguiente". ──────────────────────────────────── */}
      {flow.step !== "success" && (
        <div className="flex shrink-0 justify-between border-t pt-4">
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
