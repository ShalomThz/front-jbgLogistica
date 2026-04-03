import { toast } from "sonner";
import type { UseFormReturn } from "react-hook-form";
import type { NewOrderFormValues } from "../../domain/schemas/NewOrderForm";
import { getApiErrorCode, parseApiError } from "@contexts/shared/infrastructure/http/errors";
import { orderFieldMap } from "./orderFieldMap";

interface HandleOrderErrorOptions {
  form: UseFormReturn<NewOrderFormValues>;
  setStep?: (step: string) => void;
}

export function handleOrderError(error: unknown, { form, setStep }: HandleOrderErrorOptions) {
  const code = getApiErrorCode(error);
  const message = parseApiError(error);

  if (code) {
    const target = orderFieldMap[code];
    if (target) {
      form.setError(target.field, { message });
      if (target.step && setStep) setStep(target.step);
    }
  }

  toast.error(message, { id: "order-flow" });
}
