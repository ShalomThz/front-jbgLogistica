import { useQuery } from "@tanstack/react-query";
import { sharedRepository } from "@contexts/shared/infrastructure/services/sharedRepository";

export const useMedia = (mediaId: string | null | undefined) => {
    return useQuery({
        queryKey: ["media", mediaId],
        queryFn: () => {
            if (!mediaId) return null;
            return sharedRepository.getMediaUrl(mediaId);
        },
        enabled: !!mediaId,
    });
};
