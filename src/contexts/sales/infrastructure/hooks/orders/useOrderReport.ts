import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { Filter } from "@contexts/shared/domain/services/CreateCriteriaSchema";
import { orderRepository } from "../../services/orders/orderRepository";
import type { OrderReportResponse } from "../../../application/order/OrderReportResponse";

const ORDER_REPORT_QUERY_KEY = ["order-report"];

interface UseOrderReportOptions {
  filters?: Filter[];
  search?: string;
  enabled?: boolean;
}

export const useOrderReport = ({
  filters = [],
  search,
  enabled = true,
}: UseOrderReportOptions = {}) => {
  const { data, isLoading, error, refetch } = useQuery<OrderReportResponse>({
    queryKey: [...ORDER_REPORT_QUERY_KEY, { filters, search }],
    queryFn: () => orderRepository.report({ filters, search }),
    enabled,
    placeholderData: keepPreviousData,
  });

  return {
    report: data ?? null,
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
};
