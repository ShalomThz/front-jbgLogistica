import type { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import type { NewOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";
import { useCustomers } from "@contexts/sales/infrastructure/hooks/customers/useCustomers";
import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";

interface UseContactSaveOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<NewOrderFormValues, any, any>;
}

export const useContactSave = ({ form }: UseContactSaveOptions) => {
  const { user } = useAuth();
  const { createCustomer, updateCustomer, isUpdating, isCreating } = useCustomers();

  const saveContacts = async (): Promise<boolean> => {
    if (!user) {
      toast.error("No se pudo identificar al usuario. Inicia sesión de nuevo.");
      return false;
    }

    const { sender, recipient } = form.getValues();
    const updates: Promise<void>[] = [];
    let hasError = false;

    if (sender.save && !sender.id) {
      updates.push(
        createCustomer({ name: sender.name, company: sender.company, email: sender.email, phone: sender.phone, address: sender.address, registeredByStoreId: user.storeId })
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
        createCustomer({ name: recipient.name, company: recipient.company, email: recipient.email, phone: recipient.phone, address: recipient.address, registeredByStoreId: user.storeId })
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

  return { saveContacts, isSaving: isUpdating || isCreating };
};
