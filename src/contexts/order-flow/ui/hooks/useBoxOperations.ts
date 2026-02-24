import { useRef, useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import type { NewOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";
import { useBoxes } from "@contexts/inventory/infrastructure/hooks/boxes/useBoxes";

interface UseBoxOperationsOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<NewOrderFormValues, any, any>;
  initialValues?: NewOrderFormValues;
}

export const useBoxOperations = ({ form, initialValues }: UseBoxOperationsOptions) => {
  const { boxes, createBox, updateBox, isCreating, isUpdating } = useBoxes({ limit: 100 });

  const boxSyncedRef = useRef(false);

  useEffect(() => {
    if (boxSyncedRef.current || !initialValues?.package.boxId) return;
    const box = boxes.find((b) => b.id === initialValues.package.boxId);
    if (box) {
      form.setValue("package.packageType", box.name);
      form.setValue("package.length", box.dimensions.length.toString());
      form.setValue("package.width", box.dimensions.width.toString());
      form.setValue("package.height", box.dimensions.height.toString());
      form.setValue("package.dimensionUnit", box.dimensions.unit);
      boxSyncedRef.current = true;
    }
  }, [boxes, initialValues, form]);

  const processBox = async (): Promise<boolean> => {
    const pkg = form.getValues("package");
    let hasError = false;

    if (pkg.ownership === "STORE" && pkg.boxId) {
      const box = boxes.find((b) => b.id === pkg.boxId);
      if (box && box.stock === 0) {
        toast.error("La caja no tiene stock. Agrega stock antes de continuar.", { id: "order-flow" });
        return false;
      }
    }

    const dimensions = {
      length: parseFloat(pkg.length),
      width: parseFloat(pkg.width),
      height: parseFloat(pkg.height),
      unit: pkg.dimensionUnit,
    };

    if (pkg.boxId) {
      const originalBox = boxes.find((b) => b.id === pkg.boxId);
      const nameChanged = originalBox && pkg.packageType && pkg.packageType !== originalBox.name;
      const dimensionsChanged = originalBox && (
        dimensions.length !== originalBox.dimensions.length ||
        dimensions.width !== originalBox.dimensions.width ||
        dimensions.height !== originalBox.dimensions.height ||
        dimensions.unit !== originalBox.dimensions.unit
      );

      if (nameChanged || dimensionsChanged) {
        try {
          await updateBox(pkg.boxId, { name: pkg.packageType, dimensions });
          toast.success(`Caja "${pkg.packageType}" actualizada`, { id: "order-flow" });
        } catch {
          hasError = true;
          toast.error("No se pudo actualizar la caja", { id: "order-flow" });
        }
      }
    } else if (pkg.packageType) {
      const existingBox = boxes.find((b) => b.name === pkg.packageType);
      if (existingBox) {
        form.setValue("package.boxId", existingBox.id, { shouldValidate: true });
        toast.success(`Caja "${pkg.packageType}" ya existente, vinculada`, { id: "order-flow" });
      } else {
        try {
          const created = await createBox({ name: pkg.packageType, dimensions, stock: 1, price: { amount: 0, currency: "USD" } });
          toast.success(`Caja "${pkg.packageType}" guardada`, { id: "order-flow" });
          form.setValue("package.boxId", created.id, { shouldValidate: true });
        } catch {
          hasError = true;
          toast.error("No se pudo guardar la caja", { id: "order-flow" });
        }
      }
    }

    return !hasError;
  };

  return { processBox, boxes, updateBox, isProcessing: isCreating || isUpdating };
};
