import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  hqOrderFormSchema,
  type HQOrderFormValues,
} from "@contexts/order-flow/domain/schemas/HQOrderForm";
import { hqOrderDefaultValues } from "../../constants/newOrder.constants";

export type HQOrderStep = "contact" | "package" | "rate" | "success";

interface UseHQOrderFlowFormOptions {
  initialValues?: HQOrderFormValues;
}

export const useHQOrderFlowForm = ({ initialValues }: UseHQOrderFlowFormOptions = {}) => {
  const form = useForm<HQOrderFormValues>({
    resolver: zodResolver(hqOrderFormSchema),
    defaultValues: initialValues ?? hqOrderDefaultValues,
  });

  const validateStep = async (currentStep: "contact" | "package") => {
    if (currentStep === "contact") {
      return form.trigger(["sender", "recipient", "orderData", "orderType"]);
    }
    return form.trigger(["package"]);
  };

  return { form, validateStep };
};
