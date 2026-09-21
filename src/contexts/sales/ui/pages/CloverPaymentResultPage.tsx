import { orderRepository } from "@contexts/sales/infrastructure/services/orders/orderRepository";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import { useSearchParams } from "react-router-dom";

export const CloverPaymentResultPage = () => {
  const [params] = useSearchParams();
  const token = params.get("checkout_token");
  const query = useQuery({
    queryKey: ["public-clover-checkout", token],
    queryFn: () => orderRepository.findPublicCloverCheckout(token!),
    enabled: Boolean(token),
    refetchInterval: (current) =>
      current.state.data?.status === "PENDING" ? 2_000 : false,
  });

  if (!token) return <Result type="error" title="Enlace inválido" />;
  if (query.isLoading) {
    return <Result type="pending" title="Consultando tu pago…" />;
  }
  if (query.error || !query.data) {
    return (
      <Result
        type="error"
        title="No pudimos consultar el pago"
        message="Conserva tu comprobante y comunícate con JBG Logistics."
      />
    );
  }

  const amount = `$${query.data.amount.amount.toFixed(2)} USD`;
  if (query.data.status === "APPROVED") {
    return (
      <Result
        type="success"
        title="Pago confirmado"
        message={`Clover confirmó tu pago de ${amount}.`}
      />
    );
  }
  if (query.data.status === "DECLINED") {
    return (
      <Result
        type="error"
        title="El pago no fue aprobado"
        message="Solicita al empleado de JBG un nuevo enlace para volver a intentarlo."
      />
    );
  }
  if (query.data.status === "EXPIRED") {
    return (
      <Result
        type="error"
        title="El enlace expiró"
        message="Los enlaces de Clover duran 15 minutos. Solicita uno nuevo."
      />
    );
  }
  return (
    <Result
      type="pending"
      title="Estamos confirmando tu pago"
      message="No cierres esta página. La confirmación puede tardar unos segundos."
    />
  );
};

interface ResultProps {
  type: "success" | "pending" | "error";
  title: string;
  message?: string;
}

const Result = ({ type, title, message }: ResultProps) => (
  <main className="grid min-h-screen place-items-center bg-muted/30 p-4">
    <div className="w-full max-w-md space-y-5 rounded-2xl border bg-background p-8 text-center shadow-sm">
      {type === "success" ? (
        <CheckCircle2 className="mx-auto size-14 text-emerald-600" />
      ) : type === "pending" ? (
        <Clock3 className="mx-auto size-14 animate-pulse text-amber-500" />
      ) : (
        <XCircle className="mx-auto size-14 text-red-600" />
      )}
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {message && <p className="mt-2 text-muted-foreground">{message}</p>}
      </div>
      <p className="text-xs text-muted-foreground">
        Ya puedes cerrar esta página.
      </p>
    </div>
  </main>
);
