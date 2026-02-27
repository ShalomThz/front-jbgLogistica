import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  newOrderFormSchema,
  type NewOrderFormValues,
} from "@contexts/order-flow/domain/schemas/NewOrderForm";
import { partnerOrderDefaultValues } from "../constants/newOrder.constants";

export type PartnerOrderStep = "contact" | "package" | "pricing";

interface UsePartnerOrderFlowFormOptions {
  initialValues?: NewOrderFormValues;
}

export const usePartnerOrderFlowForm = ({ initialValues }: UsePartnerOrderFlowFormOptions = {}) => {
  const form = useForm<NewOrderFormValues>({
    resolver: zodResolver(newOrderFormSchema),
    defaultValues: initialValues ?? partnerOrderDefaultValues,
  });

  const validateStep = async (currentStep: "contact" | "package" | "pricing") => {
    if (currentStep === "contact") {
      const isValid = await form.trigger(["sender", "recipient", "orderData", "orderType"]);
      if (!isValid) return false;

      const partnerOrderNumber = form.getValues("orderData.partnerOrderNumber");
      if (!partnerOrderNumber?.trim()) {
        form.setError("orderData.partnerOrderNumber", {
          type: "manual",
          message: "El número de socio/partner es requerido",
        });
        return false;
      }
      return true;
    }
    if (currentStep === "package") {
      return form.trigger(["package.length", "package.width", "package.height"]);
    }
    // pricing step: no validation needed
    return true;
  };

  return { form, validateStep };
};
