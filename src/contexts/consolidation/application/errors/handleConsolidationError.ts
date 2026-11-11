import { toast } from "sonner";
import type { UseFormReturn, FieldValues, Path } from "react-hook-form";
import { getApiErrorCode, parseApiError } from "@contexts/shared/infrastructure/http/errors";
import { consolidationFieldMap, type ConsolidationErrorTarget } from "./consolidationFieldMap";

interface HandleConsolidationErrorOptions<T extends FieldValues> {
  form?: UseFormReturn<T>;
  setStep?: (step: string) => void;
  fieldMap?: Record<string, ConsolidationErrorTarget>;
  toastId?: string;
}

/** Error del back → campo del formulario (y su paso) + toast. Misma firma que
 * `handleOrderError` / `handleBoxError`. */
export function handleConsolidationError<T extends FieldValues>(
  error: unknown,
  {
    form,
    setStep,
    fieldMap = consolidationFieldMap,
    toastId,
  }: HandleConsolidationErrorOptions<T> = {},
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
