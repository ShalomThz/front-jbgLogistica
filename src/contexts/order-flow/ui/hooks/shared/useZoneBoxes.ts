import { useMemo } from "react";
import { useZonePriceMatrix } from "@contexts/pricing/infrastructure/hooks/tariffs/useZonePriceMatrix";
import type { ServiceLevel } from "@contexts/pricing/domain/schemas/tariff/Tariff";
import type { BoxPrimitives } from "@contexts/inventory/domain/schemas/box/Box";

interface UseZoneBoxesOptions {
  zoneId: string | undefined;
  /** Cuando se conoce, acota a las cajas con precio para ese servicio. */
  serviceLevel?: ServiceLevel;
  enabled?: boolean;
}

/**
 * Cajas que se pueden usar en una orden: las que tienen precio en la zona donde
 * se va a recoger.
 *
 * Antes esto leía la tabla de tarifas y deducía las cajas de ahí — el mecanismo
 * de precios filtrándose al paso de paquete. Ahora se lo pregunta a la matriz,
 * que es una respuesta armada por el servidor: si cambia cómo se forman los
 * precios, este hook no se entera.
 */
export const useZoneBoxes = ({
  zoneId,
  serviceLevel,
  enabled = true,
}: UseZoneBoxesOptions) => {
  const { rows, isLoading } = useZonePriceMatrix(enabled ? zoneId : undefined);

  const boxes = useMemo(() => {
    const result: BoxPrimitives[] = [];

    for (const row of rows) {
      const hasPrice = row.cells.some(
        (cell) =>
          (!serviceLevel || cell.serviceLevel === serviceLevel) &&
          (cell.public !== null || cell.partner !== null),
      );
      if (hasPrice) result.push(row.box);
    }

    return result;
  }, [rows, serviceLevel]);

  return { boxes, isLoading };
};
