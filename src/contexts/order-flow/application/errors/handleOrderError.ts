import { toast } from "sonner";
import type { UseFormReturn, FieldValues, Path } from "react-hook-form";
import { getApiErrorCode, parseApiError } from "@contexts/shared/infrastructure/http/errors";
import { orderFieldMap } from "./orderFieldMap";

interface HandleOrderErrorOptions<T extends FieldValues> {
  form: UseFormReturn<T>;
  setStep?: (step: string) => void;
}

export function handleOrderError<T extends FieldValues>(error: unknown, { form, setStep }: HandleOrderErrorOptions<T>) {
  const code = getApiErrorCode(error);
  const message = parseApiError(error);

  if (code) {
    const target = orderFieldMap[code];
    if (target) {
      form.setError(target.field as Path<T>, { message });
      if (target.step && setStep) setStep(target.step);
    }
  }

  toast.error(message, { id: "order-flow" });
}
