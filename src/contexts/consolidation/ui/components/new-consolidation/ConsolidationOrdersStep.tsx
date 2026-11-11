import { useFormContext, useWatch } from "react-hook-form";
import type { NewConsolidationFormValues } from "@contexts/consolidation/domain/schemas/consolidation/NewConsolidationForm";
import { OrderPicker } from "@contexts/consolidation/ui/components/OrderPicker";
import { DEFAULT_LINEAR_FEET_DIVISOR } from "@contexts/consolidation/domain/calculateLinearFeet";

/** Paso 2: el picker de órdenes sobre el campo `orders` del formulario. Es
 * opcional: se pueden agregar después desde el consolidado. */
export const ConsolidationOrdersStep = () => {
  const { control, setValue } = useFormContext<NewConsolidationFormValues>();
  const [orders, capacity, divisor] = useWatch({
    control,
    name: ["orders", "capacityLinearFeet", "linearFeetDivisor"],
  });

  return (
    // Altura mínima: en pantallas bajas el picker no se aplasta; la página
    // scrollea en vez de recortarlo.
    <div className="flex min-h-[28rem] flex-1 flex-col">
      <OrderPicker
        selected={orders}
        onChange={(next) => setValue("orders", next)}
        capacityLinearFeet={Number(capacity) || 0}
        linearFeetDivisor={Number(divisor) || DEFAULT_LINEAR_FEET_DIVISOR}
        compact
      />
    </div>
  );
};
