import { useParams } from "react-router-dom";
import { useOrder } from "@contexts/sales/infrastructure/hooks/orders/useOrder";
import { PageLoader } from "@contexts/shared/ui/components/PageLoader";
import { mapOrderToFormValues } from "../../application/mapOrderToFormValues";
import { NewOrderPage } from "./NewOrderPage";

export const EditOrderPage = () => {
  const { id } = useParams<{ id: string }>();
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

  return <NewOrderPage initialValues={initialValues} orderId={order.id} />;
};
