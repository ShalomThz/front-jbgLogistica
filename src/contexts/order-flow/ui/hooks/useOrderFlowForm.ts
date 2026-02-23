import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  newOrderFormSchema,
  type NewOrderFormValues,
} from "@contexts/order-flow/domain/schemas/NewOrderForm";
import { newOrderDefaultValues } from "../constants/newOrder.constants";

export type OrderStep = "contact" | "package" | "rate";

interface UseOrderFlowFormOptions {
  initialValues?: NewOrderFormValues;
}

export const useOrderFlowForm = ({ initialValues }: UseOrderFlowFormOptions = {}) => {
  const form = useForm<NewOrderFormValues>({
    resolver: zodResolver(newOrderFormSchema),
    defaultValues: initialValues ?? newOrderDefaultValues,
  });

  const validateStep = async (currentStep: "contact" | "package") => {
    if (currentStep === "contact") {
      return form.trigger(["sender", "recipient", "orderData", "orderType"]);
    }
    return form.trigger(["package"]);
  };

  return { form, validateStep };
};
