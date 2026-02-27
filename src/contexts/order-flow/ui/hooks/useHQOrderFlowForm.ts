import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  newOrderFormSchema,
  type NewOrderFormValues,
} from "@contexts/order-flow/domain/schemas/NewOrderForm";
import { hqOrderDefaultValues } from "../constants/newOrder.constants";

export type HQOrderStep = "contact" | "package" | "rate";

interface UseHQOrderFlowFormOptions {
  initialValues?: NewOrderFormValues;
}

export const useHQOrderFlowForm = ({ initialValues }: UseHQOrderFlowFormOptions = {}) => {
  const form = useForm<NewOrderFormValues>({
    resolver: zodResolver(newOrderFormSchema),
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
