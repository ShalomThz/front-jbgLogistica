import { useQuery } from "@tanstack/react-query";
import { boxSaleRepository } from "@contexts/inventory/infrastructure/services/boxSales/boxSaleRepository";

export const useBoxSale = (id: string | undefined) =>
  useQuery({
    queryKey: ["box-sales", id],
    queryFn: () => boxSaleRepository.findById(id!),
    enabled: !!id,
  });
