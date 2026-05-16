import { useQuery } from "@tanstack/react-query";
import { packageRepository } from "@/contexts/warehouse/infrastructure/services/packageRepository";

export const usePackage = (id: string | undefined) =>
  useQuery({
    queryKey: ["packages", id],
    queryFn: () => packageRepository.getById(id!),
    enabled: !!id,
  });
