import { useRef, useEffect } from "react";
import type { UseFormReturn, FieldValues } from "react-hook-form";
import { toast } from "sonner";
import { useBoxes } from "@contexts/inventory/infrastructure/hooks/boxes/useBoxes";

interface UseBoxOperationsOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<FieldValues, any, any>;
  initialValues?: FieldValues;
  enabled?: boolean;
}

export const useBoxOperations = ({ form, initialValues, enabled = true }: UseBoxOperationsOptions) => {
  const { boxes, updateBox } = useBoxes({ enabled });

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

    if (pkg.ownership === "STORE" && pkg.boxId) {
      const box = boxes.find((b) => b.id === pkg.boxId);
      if (box && box.stock === 0) {
        toast.error("La caja no tiene stock. Agrega stock antes de continuar.", { id: "order-flow" });
        return false;
      }
    }

    return true;
  };

  return { processBox, boxes, updateBox, isProcessing: false };
};
