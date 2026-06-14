import type { CostBreakdownPrimitives } from "@contexts/sales/domain/schemas/value-objects/CostBreakdown";
import type { MoneyPrimitives } from "@contexts/shared/domain/schemas/Money";
import { Button } from "@contexts/shared/shadcn";
import { ArrowLeft } from "lucide-react";
import { useCallback } from "react";
import { FormProvider } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import type { HQOrderFormValues } from "../../domain/schemas/NewOrderForm";
import { HQContactStep } from "../components/hq/contact/HQContactStep";
import { HQPackageStep } from "../components/hq/package/HQPackageStep";
import { RateStep } from "../components/hq/rate/RateStep";
import { FulfillmentLoadingDialog } from "../components/hq/rate/FulfillmentLoadingDialog";
import { OrderSuccessView } from "../components/order/OrderSuccessView";
import { StepIndicator } from "../components/shared/StepIndicator";
import { useHQOrderFlow } from "../hooks/hq/useHQOrderFlow";

interface NewHQOrderPageProps {
  initialValues?: HQOrderFormValues;
  orderId?: string;
  partnerPrice?: MoneyPrimitives | null;
  partnerCostBreakdown?: CostBreakdownPrimitives;
  storeName?: string;
  partnerOrderNumber?: string;
  storeId?: string;
}

export const NewHQOrderPage = (props: NewHQOrderPageProps = {}) => {
  const location = useLocation();
  const stateInitial = (location.state as { initialValues?: HQOrderFormValues } | null)?.initialValues;
  return (
    <NewHQOrderPageInner
      key={location.key}
      {...props}
      initialValues={props.initialValues ?? stateInitial}
    />
  );
};

const NewHQOrderPageInner = ({ initialValues, orderId, partnerPrice, partnerCostBreakdown, storeName, partnerOrderNumber, storeId }: NewHQOrderPageProps) => {
  const navigate = useNavigate();
  const flow = useHQOrderFlow({ initialValues, orderId, storeId });

  const handleCreateBlank = useCallback(() => {
    navigate("/orders/new/hq", { replace: true, state: null });
  }, [navigate]);

  const handleCreateSameClient = useCallback(() => {
    const values = flow.form.getValues();
    const cleaned: HQOrderFormValues = {
      ...values,
      orderData: {
        orderNumber: "",
        partnerOrderNumber: "",
      },
    };
    navigate("/orders/new/hq", { replace: true, state: { initialValues: cleaned } });
  }, [flow.form, navigate]);

  const title = (() => {
    const action = flow.isEditing ? "Editar Orden JBG" : "Nueva Orden JBG";
    if (storeName) {
      const partnerRef = partnerOrderNumber ? ` (#${partnerOrderNumber})` : "";
      return `${action} — Partner: ${storeName}${partnerRef}`;
    }
    return action;
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
          <HQContactStep
            {...(flow.canSelectStore && {
              selectedStoreId: flow.selectedStoreId,
              onStoreChange: flow.setSelectedStoreId,
            })}
          />
        )}

        {flow.step === "package" && (
          <HQPackageStep onEditContacts={() => flow.setStep("contact")} />
        )}

        {flow.step === "rate" && (
          <RateStep
            rates={flow.rates}
            isLoadingRates={flow.isLoadingRates}
            ratesError={flow.ratesError}
            onRefetch={flow.refetchRates}
            onSubmit={flow.selectAndFulfill}
            onBack={flow.handleBack}
            isSubmitting={flow.isProcessingShipment}
            fulfilledShipment={flow.fulfilledShipment}
            onFinish={flow.goToOrders}
            onCreateBlank={handleCreateBlank}
            onCreateSameClient={handleCreateSameClient}
            partnerPrice={partnerPrice}
            partnerCostBreakdown={partnerCostBreakdown}
            markAsPaid={flow.markAsPaid}
            onMarkAsPaidChange={flow.setMarkAsPaid}
            tariff={flow.tariff}
            isLoadingTariff={flow.isLoadingTariff}
            tariffError={flow.tariffError}
            tariffZoneId={flow.tariffZoneId}
            tariffDestinationCountry={flow.tariffDestinationCountry}
            tariffBoxId={flow.tariffBoxId}
            warehouseAddresses={flow.warehouseAddresses}
            selectedWarehouseAddress={flow.selectedWarehouseAddress}
            onWarehouseAddressChange={flow.setSelectedWarehouseAddress}
            isLoadingAddresses={flow.isLoadingAddresses}
          />
        )}

        {flow.step === "success" && flow.fulfilledShipment && (
          <OrderSuccessView
            shipment={flow.fulfilledShipment}
            orderId={flow.fulfilledShipment.orderId}
            totalBilled={flow.totalBilled}
            onFinish={flow.goToOrders}
            onCreateBlank={handleCreateBlank}
            onCreateSameClient={handleCreateSameClient}
          />
        )}
      </FormProvider>

      <FulfillmentLoadingDialog
        open={flow.isProcessingShipment || !!flow.shipmentError}
        phase={flow.shipmentPhase}
        error={flow.shipmentError}
        onRetry={flow.selectAndFulfill}
        onChangeCarrier={flow.clearShipmentError}
      />

      {/* Bottom Navigation */}
      {flow.step !== "rate" && flow.step !== "success" && (
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
