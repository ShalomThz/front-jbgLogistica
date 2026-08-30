import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  partnerOrderFormSchema,
  type PartnerOrderFormValues,
} from "@contexts/order-flow/domain/schemas/PartnerOrderForm";
import { partnerOrderDefaultValues } from "../../constants/newOrder.constants";

/** `rate` es lo que el socio le paga a JBG; `pricing` es lo que él le cobra a
 * su cliente. Dos relaciones de plata, dos pasos. */
export type PartnerOrderStep =
  | "contact"
  | "package"
  | "rate"
  | "pricing"
  | "success";

interface UsePartnerOrderFlowFormOptions {
  initialValues?: PartnerOrderFormValues;
}

export const usePartnerOrderFlowForm = ({ initialValues }: UsePartnerOrderFlowFormOptions = {}) => {
  const form = useForm<PartnerOrderFormValues>({
    resolver: zodResolver(partnerOrderFormSchema),
    defaultValues: initialValues ?? partnerOrderDefaultValues,
  });

  const validateStep = async (
    currentStep: "contact" | "package" | "rate" | "pricing",
  ) => {
    if (currentStep === "contact") {
      return form.trigger(["sender", "recipient", "orderData", "orderType"]);
    }
    if (currentStep === "package") {
      return form.trigger(["package.length", "package.width", "package.height"]);
    }
    // rate y pricing: sin validación de form. El precio se valida por el botón
    // (no se avanza sin monto) y los abonos al enviar.
    return true;
  };

  return { form, validateStep };
};
