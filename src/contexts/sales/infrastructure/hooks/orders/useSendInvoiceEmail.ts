import { orderRepository } from "@contexts/sales/infrastructure/services/orders/orderRepository";
import { parseApiError } from "@contexts/shared/infrastructure/http/errors";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export const useSendInvoiceEmail = () => {
  const mutation = useMutation({
    mutationFn: (orderId: string) => orderRepository.sendInvoiceEmail(orderId),
    onSuccess: ({ invoiceNumber, recipientEmail }) => {
      toast.success(
        `Factura ${invoiceNumber} enviada a ${recipientEmail}`,
        { id: "invoice-email" },
      );
    },
    onError: (error) => {
      toast.error(parseApiError(error), { id: "invoice-email" });
    },
  });

  return {
    sendInvoiceEmail: mutation.mutate,
    sendingInvoiceOrderId: mutation.isPending ? mutation.variables : null,
  };
};
