import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  newOrderFormSchema,
  type NewOrderFormValues,
} from "@contexts/order-flow/domain/schemas/NewOrderForm";
import { newOrderDefaultValues } from "../constants/newOrder.constants";

export type OrderStep = "contact" | "package" | "rate";

interface UseNewOrderFormOptions {
  initialValues?: NewOrderFormValues;
}

export const useNewOrderForm = ({ initialValues }: UseNewOrderFormOptions = {}) => {
  const form = useForm<NewOrderFormValues>({
    resolver: zodResolver(newOrderFormSchema),
    defaultValues: initialValues ?? newOrderDefaultValues,
  });

  const [step, setStep] = useState<OrderStep>("contact");
  const [shipmentId, setShipmentId] = useState<string | null>(null);

  const validateStep = async (currentStep: "contact" | "package") => {
    if (currentStep === "contact") {
      return form.trigger(["sender", "recipient", "orderData", "orderType"]);
    }
    return form.trigger(["package"]);
  };

  return { form, step, setStep, shipmentId, setShipmentId, validateStep };
};
