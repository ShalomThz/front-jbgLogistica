import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  partnerOrderFormSchema,
  type PartnerOrderFormValues,
} from "@contexts/order-flow/domain/schemas/PartnerOrderForm";
import { partnerOrderDefaultValues } from "../../constants/newOrder.constants";

export type PartnerOrderStep = "contact" | "package" | "pricing" | "success";

interface UsePartnerOrderFlowFormOptions {
  initialValues?: PartnerOrderFormValues;
}

export const usePartnerOrderFlowForm = ({ initialValues }: UsePartnerOrderFlowFormOptions = {}) => {
  const form = useForm<PartnerOrderFormValues>({
    resolver: zodResolver(partnerOrderFormSchema),
    defaultValues: initialValues ?? partnerOrderDefaultValues,
  });

  const validateStep = async (currentStep: "contact" | "package" | "pricing") => {
    if (currentStep === "contact") {
      return form.trigger(["sender", "recipient", "orderData", "orderType"]);
    }
    if (currentStep === "package") {
      return form.trigger(["package.length", "package.width", "package.height"]);
    }
    return true;
  };

  return { form, validateStep };
};
