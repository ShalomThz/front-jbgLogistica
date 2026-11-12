import { useQuery } from "@tanstack/react-query";
import { consolidationRepository } from "@contexts/consolidation/infrastructure/services/consolidationRepository";
import { consolidationKeys } from "./consolidationKeys";

/** Las métricas del listado, calculadas en el back sobre todos los
 * consolidados: el listado pagina y no las puede sacar de una página. */
export const useConsolidationStats = () => {
  const { data } = useQuery({
    queryKey: consolidationKeys.stats(),
    queryFn: () => consolidationRepository.stats(),
  });
  return { stats: data ?? null };
};
