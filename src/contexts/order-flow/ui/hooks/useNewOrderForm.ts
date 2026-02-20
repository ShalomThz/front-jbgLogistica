import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  newOrderFormSchema,
  type NewOrderFormValues,
} from "@contexts/order-flow/domain/schemas/NewOrderForm";
import { newOrderDefaultValues } from "../constants/newOrder.constants";
import { useCustomers } from "@contexts/sales/infrastructure/hooks/customers/useCustomers";
import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { useBoxes } from "@contexts/inventory/infrastructure/hooks/boxes/useBoxes";

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
  const { user } = useAuth();
  const { createCustomer, updateCustomer, isUpdating, isCreating } = useCustomers();
  const { boxes, createBox, updateBox, isCreating: isCreatingBox, isUpdating: isUpdatingBox } = useBoxes({ limit: 100 });

  const validateStep = async (currentStep: "contact" | "package") => {
    if (currentStep === "contact") {
      return form.trigger(["sender", "recipient", "orderData", "orderType"]);
    }
    return form.trigger(["package"]);
  };

  const handleContactNext = async () => {
    const valid = await validateStep("contact");
    if (!valid) return false;

    const { sender, recipient } = form.getValues();
    const updates: Promise<void>[] = [];
    let hasError = false;

    if (sender.save && !sender.id) {
      updates.push(
        createCustomer({ name: sender.name, company: sender.company, email: sender.email, phone: sender.phone, address: sender.address, registeredByStoreId: user!.storeId })
          .then((created) => {
            toast.success(`Remitente "${sender.name}" guardado`);
            form.setValue("sender.id", created.id);
            form.setValue("sender.save", false);
          })
          .catch((err) => {
            hasError = true;
            toast.error(err?.message ?? `No se pudo guardar el remitente "${sender.name}"`);
          }),
      );
    }

    if (sender.save && sender.id) {
      updates.push(
        updateCustomer(sender.id, { name: sender.name, company: sender.company, email: sender.email, phone: sender.phone, address: sender.address })
          .then(() => {
            toast.success(`Remitente "${sender.name}" actualizado`);
            form.setValue("sender.save", false);
          })
          .catch((err) => {
            hasError = true;
            toast.error(err?.message ?? `No se pudo actualizar el remitente "${sender.name}"`);
          }),
      );
    }

    if (recipient.save && !recipient.id) {
      updates.push(
        createCustomer({ name: recipient.name, company: recipient.company, email: recipient.email, phone: recipient.phone, address: recipient.address, registeredByStoreId: user!.storeId })
          .then((created) => {
            toast.success(`Destinatario "${recipient.name}" guardado`);
            form.setValue("recipient.id", created.id);
            form.setValue("recipient.save", false);
          })
          .catch((err) => {
            hasError = true;
            toast.error(err?.message ?? `No se pudo guardar el destinatario "${recipient.name}"`);
          }),
      );
    }

    if (recipient.save && recipient.id) {
      updates.push(
        updateCustomer(recipient.id, { name: recipient.name, company: recipient.company, email: recipient.email, phone: recipient.phone, address: recipient.address })
          .then(() => {
            toast.success(`Destinatario "${recipient.name}" actualizado`);
            form.setValue("recipient.save", false);
          })
          .catch((err) => {
            hasError = true;
            toast.error(err?.message ?? `No se pudo actualizar el destinatario "${recipient.name}"`);
          }),
      );
    }

    await Promise.all(updates);
    return !hasError;
  };

  const handlePackageNext = async () => {
    const valid = await validateStep("package");
    if (!valid) return false;

    const pkg = form.getValues("package");

    if (pkg.ownership === "STORE" && pkg.boxId) {
      const box = boxes.find((b) => b.id === pkg.boxId);
      if (box && box.stock === 0) {
        toast.error("La caja no tiene stock. Agrega stock antes de continuar.");
        return false;
      }
    }
    const dimensions = {
      length: parseFloat(pkg.length),
      width: parseFloat(pkg.width),
      height: parseFloat(pkg.height),
      unit: pkg.dimensionUnit,
    };

    if (pkg.boxId) {
      const originalBox = boxes.find((b) => b.id === pkg.boxId);
      const nameChanged = originalBox && pkg.packageType !== originalBox.name;
      const dimensionsChanged = originalBox && (
        dimensions.length !== originalBox.dimensions.length ||
        dimensions.width !== originalBox.dimensions.width ||
        dimensions.height !== originalBox.dimensions.height ||
        dimensions.unit !== originalBox.dimensions.unit
      );

      if (nameChanged || dimensionsChanged) {
        await updateBox(pkg.boxId, { name: pkg.packageType, dimensions })
          .then(() => { toast.success(`Caja "${pkg.packageType}" actualizada`); })
          .catch(() => { toast.error(`No se pudo actualizar la caja`); });
      }
    } else if (pkg.packageType) {
      await createBox({ name: pkg.packageType, dimensions, stock: 1 })
        .then((created) => {
          toast.success(`Caja "${pkg.packageType}" guardada`);
          form.setValue("package.boxId", created.id, { shouldValidate: true });
        })
        .catch(() => { toast.error(`No se pudo guardar la caja`); });
    }

    return true;
  };

  return { form, step, setStep, shipmentId, setShipmentId, validateStep, handleContactNext, handlePackageNext, isUpdatingContacts: isUpdating || isCreating, isProcessingBox: isCreatingBox || isUpdatingBox };
};
