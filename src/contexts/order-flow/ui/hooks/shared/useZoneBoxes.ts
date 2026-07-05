import { useMemo } from "react";
import { useTariffs } from "@contexts/pricing/infrastructure/hooks/tariffs/useTariffs";
import type { BoxPrimitives } from "@contexts/inventory/domain/schemas/box/Box";

interface UseZoneBoxesOptions {
  zoneId: string | undefined;
  destinationCountry: string | undefined;
  enabled?: boolean;
}

/**
 * Cajas que una tienda puede usar en una orden: las que tienen una tarifa
 * configurada para su zona de origen + el país destino de la orden. No existe
 * un vínculo Box→zona; la relación vive en las tarifas, así que derivamos las
 * cajas de ahí (una caja puede repetirse en varias tarifas → deduplicamos).
 */
export const useZoneBoxes = ({
  zoneId,
  destinationCountry,
  enabled = true,
}: UseZoneBoxesOptions) => {
  const filters = useMemo(
    () =>
      zoneId && destinationCountry
        ? [
            { field: "zone.id", filterOperator: "=" as const, value: zoneId },
            {
              field: "destinationCountry",
              filterOperator: "=" as const,
              value: destinationCountry,
            },
          ]
        : [],
    [zoneId, destinationCountry],
  );

  // Sin limit → trae todas las tarifas de la zona+país (no capamos el fetch).
  const { tariffs, isLoading } = useTariffs({
    filters,
    enabled: enabled && !!zoneId && !!destinationCountry,
  });

  const boxes = useMemo(() => {
    const byId = new Map<string, BoxPrimitives>();
    for (const tariff of tariffs) byId.set(tariff.box.id, tariff.box);
    return [...byId.values()];
  }, [tariffs]);

  return { boxes, isLoading };
};
