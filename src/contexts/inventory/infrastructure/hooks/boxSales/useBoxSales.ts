import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { boxSaleRepository } from "@contexts/inventory/infrastructure/services/boxSales/boxSaleRepository";
import type { SellBoxRequestPrimitives } from "@contexts/inventory/application/SellBoxRequest";
import type { FindBoxSalesResponsePrimitives } from "@contexts/inventory/application/FindBoxSalesResponse";

const BOX_SALES_QUERY_KEY = ["box-sales"];
const BOXES_QUERY_KEY = ["boxes"];

interface UseBoxSalesOptions {
  page?: number;
  limit?: number;
  enabled?: boolean;
}

export const useBoxSales = ({ page = 1, limit = 10, enabled = true }: UseBoxSalesOptions = {}) => {
  const queryClient = useQueryClient();
  const offset = (page - 1) * limit;

  const { data, isLoading, error, refetch } = useQuery<FindBoxSalesResponsePrimitives>({
    queryKey: [...BOX_SALES_QUERY_KEY, { page, limit }],
    queryFn: () => boxSaleRepository.find({ filters: [], limit, offset }),
    enabled,
  });

  const sales = data?.data ?? [];
  const pagination = data?.pagination ?? null;
  const totalPages = pagination ? Math.ceil(pagination.total / limit) : 1;

  const sellMutation = useMutation({
    mutationFn: (request: SellBoxRequestPrimitives) => boxSaleRepository.sell(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BOX_SALES_QUERY_KEY });
      // Invalidate boxes so stock updates reflect immediately
      queryClient.invalidateQueries({ queryKey: BOXES_QUERY_KEY });
    },
  });

  const receiptMutation = useMutation({
    mutationFn: async (saleId: string) => {
      const blob = await boxSaleRepository.getReceipt(saleId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recibo-${saleId.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });

  const printMutation = useMutation({
    mutationFn: async (saleId: string) => {
      const blob = await boxSaleRepository.getReceipt(saleId);
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url);
      if (printWindow) {
        printWindow.addEventListener("load", () => {
          printWindow.print();
        });
      }
    },
  });

  return {
    sales,
    pagination,
    totalPages,
    isLoading,
    error: error?.message ?? null,
    refetch,

    sellBox: (request: SellBoxRequestPrimitives) => sellMutation.mutateAsync(request),
    isSelling: sellMutation.isPending,
    sellError: sellMutation.error?.message ?? null,

    downloadReceipt: (saleId: string) => receiptMutation.mutateAsync(saleId),
    isDownloadingReceipt: receiptMutation.isPending,

    printReceipt: (saleId: string) => printMutation.mutateAsync(saleId),
    isPrintingReceipt: printMutation.isPending,
  };
};
