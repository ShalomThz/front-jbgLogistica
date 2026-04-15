import type { OrderListView } from "@contexts/sales/domain/schemas/order/OrderListViewSchemas";
import { useOrder } from "@contexts/sales/infrastructure/hooks/orders/useOrder";
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

export const useOrderDialog = (orders: OrderListView[]) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const selectedOrderId = searchParams.get("orderId");

    const selectedOrderFromList = useMemo(
        () => orders.find((o) => o.id === selectedOrderId) || null,
        [orders, selectedOrderId]
    );

    const { data: fetchedOrder } = useOrder(
        selectedOrderId && !selectedOrderFromList ? selectedOrderId : undefined
    );

    const selectedOrder = selectedOrderFromList || fetchedOrder || null;

    const handleOpenDialog = (order: OrderListView) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set("orderId", order.id);
        setSearchParams(newParams);
    };

    const handleCloseDialog = () => {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("orderId");
        setSearchParams(newParams);
    };

    return {
        selectedOrderId,
        selectedOrder,
        handleOpenDialog,
        handleCloseDialog,
    };
};
