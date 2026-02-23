import { useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { useAddressSearch } from "@contexts/shared/infrastructure/hooks/useAddressSearch";
import type { PlaceDetailsResponse } from "@contexts/shared/domain/schemas/address/PlaceDetailsResponse";

interface AddressSuggestionsProps {
  query: string;
  onSelect: (details: PlaceDetailsResponse) => void;
}

export function AddressSuggestions({ query, onSelect }: AddressSuggestionsProps) {
  const [dismissedQuery, setDismissedQuery] = useState<string | null>(null);
  const { suggestions, isLoading, getPlaceDetails, isLoadingDetails } = useAddressSearch({ input: query });

  const dismissed = dismissedQuery === query;

  const handleSelect = async (placeId: string) => {
    const details = await getPlaceDetails(placeId);
    const filledQuery = [details.address1, details.city, details.province].filter(Boolean).join(", ");
    setDismissedQuery(filledQuery);
    onSelect(details);
  };

  if (dismissed && !isLoadingDetails) {
    return null;
  }

  if (suggestions.length === 0 && !isLoading && !isLoadingDetails) {
    return null;
  }

  return (
    <div className="rounded-md border bg-muted/50 p-2 space-y-1 max-h-48 overflow-y-auto">
      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
        <MapPin className="size-3" />
        {isLoadingDetails
          ? "Obteniendo detalles..."
          : isLoading
            ? "Buscando sugerencias..."
            : "Sugerencias"}
      </p>
      {(isLoading || isLoadingDetails) && (
        <div className="flex items-center gap-2 py-1 text-sm text-muted-foreground">
          <Loader2 className="size-3 animate-spin" />
          {isLoadingDetails ? "Cargando dirección..." : "Buscando..."}
        </div>
      )}
      {!isLoading &&
        !isLoadingDetails &&
        suggestions.map((s) => (
          <button
            key={s.placeId}
            type="button"
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
            onClick={() => handleSelect(s.placeId)}
          >
            <MapPin className="size-3 shrink-0 text-muted-foreground" />
            <span className="min-w-0">
              <span className="font-medium">{s.mainText}</span>
              <span className="text-muted-foreground"> · {s.secondaryText}</span>
            </span>
          </button>
        ))}
    </div>
  );
}
