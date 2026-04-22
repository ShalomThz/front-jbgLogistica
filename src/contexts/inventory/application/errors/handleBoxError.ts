import { toast } from "sonner";
import type { UseFormReturn, FieldValues, Path } from "react-hook-form";
import { getApiErrorCode, parseApiError } from "@contexts/shared/infrastructure/http/errors";
import { boxFieldMap, type BoxErrorTarget } from "./boxFieldMap";

interface HandleBoxErrorOptions<T extends FieldValues> {
  form?: UseFormReturn<T>;
  setStep?: (step: string) => void;
  fieldMap?: Record<string, BoxErrorTarget>;
  toastId?: string;
}

export function handleBoxError<T extends FieldValues>(
  error: unknown,
  { form, setStep, fieldMap = boxFieldMap, toastId }: HandleBoxErrorOptions<T> = {},
) {
  const code = getApiErrorCode(error);
  const message = parseApiError(error);

  if (code && form) {
    const target = fieldMap[code];
    if (target) {
      form.setError(target.field as Path<T>, { message });
      if (target.step && setStep) setStep(target.step);
    }
  }

  toast.error(message, toastId ? { id: toastId } : undefined);
}
