import { useParams, useSearchParams } from "react-router-dom";
import { useOrder } from "@contexts/sales/infrastructure/hooks/orders/useOrder";
import { PageLoader } from "@contexts/shared/ui/components/PageLoader";
import { mapOrderToFormValues } from "../../application/mapOrderToFormValues";
import { NewHQOrderPage } from "./NewHQOrderPage";
import { NewPartnerOrderPage } from "./NewPartnerOrderPage";

export const EditOrderPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode");
  const { data: order, isLoading, error } = useOrder(id);

  if (isLoading) {
    return <PageLoader text="Cargando orden..." />;
  }

  if (error || !order) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-destructive">
          {error?.message ?? "No se encontró la orden"}
        </p>
      </div>
    );
  }

  const initialValues = mapOrderToFormValues(order);

  if (order.type === "PARTNER" && mode !== "complete") {
    return <NewPartnerOrderPage initialValues={initialValues} orderId={order.id} />;
  }
  return <NewHQOrderPage initialValues={initialValues} orderId={order.id} />;
};
