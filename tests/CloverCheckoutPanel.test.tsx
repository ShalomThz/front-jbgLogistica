import { CloverCheckoutPanel } from "@contexts/order-flow/ui/components/order/orders-table/CloverCheckoutPanel";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const origin = { name: "Carlos Cliente", email: "cliente@example.com" };
const destination = { name: "María Destinataria", email: "destino@example.com" };

describe("CloverCheckoutPanel", () => {
  it("lets the employee create a flexible partial USD payment link", async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(
      <CloverCheckoutPanel
        outstanding={80}
        checkout={null}
        onCreate={onCreate}
        origin={origin}
        destination={destination}
        onSendEmail={vi.fn()}
        isLoading={false}
        isSendingEmail={false}
      />,
    );

    const input = screen.getByLabelText("Monto a cobrar con Clover");
    fireEvent.change(input, { target: { value: "35.50" } });
    await userEvent.click(
      screen.getByRole("button", { name: "Generar enlace" }),
    );

    expect(onCreate).toHaveBeenCalledWith({
      amount: 35.5,
      currency: "USD",
    });
  });

  it("previews the sender by default and switches to the recipient on request", async () => {
    render(
      <CloverCheckoutPanel
        outstanding={80}
        checkout={null}
        onCreate={vi.fn()}
        origin={origin}
        destination={destination}
        onSendEmail={vi.fn()}
        isLoading={false}
        isSendingEmail={false}
      />,
    );

    expect(screen.getByText(origin.name)).toBeInTheDocument();
    expect(screen.getByText(origin.email)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Destinatario" }));

    expect(screen.getByText(destination.name)).toBeInTheDocument();
    expect(screen.getByText(destination.email)).toBeInTheDocument();
  });

  const activeCheckout = {
    id: "checkout-1",
    orderId: "order-1",
    checkoutSessionId: "session-1",
    publicToken: "public-1",
    href: "https://checkout.clover.test/session-1",
    amount: { amount: 35.5, currency: "USD" as const },
    status: "PENDING" as const,
    cloverPaymentId: null,
    createdBy: "user-1",
    expiresAt: "2099-08-19T18:15:00.000Z",
    createdAt: "2099-08-19T18:00:00.000Z",
    updatedAt: "2099-08-19T18:00:00.000Z",
  };

  it("shows an active link returned by Clover", () => {
    render(
      <CloverCheckoutPanel
        outstanding={80}
        checkout={activeCheckout}
        onCreate={vi.fn()}
        origin={origin}
        destination={destination}
        onSendEmail={vi.fn()}
        isLoading={false}
        isSendingEmail={false}
      />,
    );

    expect(screen.getByRole("link", { name: "Abrir enlace" })).toHaveAttribute(
      "href",
      "https://checkout.clover.test/session-1",
    );
    expect(screen.getByText("$35.50 USD")).toBeInTheDocument();
  });

  it("lets the employee choose to email the origin", async () => {
    const onSendEmail = vi
      .fn()
      .mockResolvedValue({ recipientEmail: "cliente@example.com" });
    render(
      <CloverCheckoutPanel
        outstanding={80}
        checkout={activeCheckout}
        onCreate={vi.fn()}
        origin={origin}
        destination={destination}
        onSendEmail={onSendEmail}
        isLoading={false}
        isSendingEmail={false}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: /Enviar por correo/ }),
    );
    await userEvent.click(screen.getByText("Al remitente"));

    expect(onSendEmail).toHaveBeenCalledWith("origin");
  });

  it("lets the employee choose to email the destination", async () => {
    const onSendEmail = vi
      .fn()
      .mockResolvedValue({ recipientEmail: "destino@example.com" });
    render(
      <CloverCheckoutPanel
        outstanding={80}
        checkout={activeCheckout}
        onCreate={vi.fn()}
        origin={origin}
        destination={destination}
        onSendEmail={onSendEmail}
        isLoading={false}
        isSendingEmail={false}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: /Enviar por correo/ }),
    );
    await userEvent.click(screen.getByText("Al destinatario"));

    expect(onSendEmail).toHaveBeenCalledWith("destination");
  });

  it("displays conversion details and charges in USD when order is billed in MXN", async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(
      <CloverCheckoutPanel
        outstanding={52.64}
        billedCurrency="MXN"
        billedPending={1000}
        exchangeRate={0.05263158}
        checkout={null}
        onCreate={onCreate}
        origin={origin}
        destination={destination}
        onSendEmail={vi.fn()}
        isLoading={false}
        isSendingEmail={false}
      />,
    );

    expect(screen.getByText("$1000.00 MXN")).toBeInTheDocument();
    expect(screen.getByText("$52.64 USD")).toBeInTheDocument();
    expect(screen.getByText(/Tipo de cambio: 1 USD ≈ \$19.00 MXN/)).toBeInTheDocument();

    const input = screen.getByLabelText("Monto a cobrar con Clover");
    expect(input).toHaveValue(52.64);

    await userEvent.click(
      screen.getByRole("button", { name: "Generar enlace" }),
    );

    expect(onCreate).toHaveBeenCalledWith({
      amount: 52.64,
      currency: "USD",
    });
  });

  it("shows loading state when exchange rate is fetching", () => {
    render(
      <CloverCheckoutPanel
        outstanding={0}
        billedCurrency="MXN"
        billedPending={1000}
        isLoadingRate={true}
        checkout={null}
        onCreate={vi.fn()}
        origin={origin}
        destination={destination}
        onSendEmail={vi.fn()}
        isLoading={false}
        isSendingEmail={false}
      />,
    );

    expect(
      screen.getByText("Consultando tipo de cambio actual a USD…"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Generar enlace" }),
    ).toBeDisabled();
  });

  it("shows error state when exchange rate fails", () => {
    render(
      <CloverCheckoutPanel
        outstanding={0}
        billedCurrency="MXN"
        billedPending={1000}
        rateError="No se pudo conectar con el servicio de divisas"
        checkout={null}
        onCreate={vi.fn()}
        origin={origin}
        destination={destination}
        onSendEmail={vi.fn()}
        isLoading={false}
        isSendingEmail={false}
      />,
    );

    expect(
      screen.getByText("No se pudo conectar con el servicio de divisas"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Generar enlace" }),
    ).toBeDisabled();
  });

  it("shows MXN equivalent for active checkout on MXN order", () => {
    render(
      <CloverCheckoutPanel
        outstanding={52.64}
        billedCurrency="MXN"
        billedPending={1000}
        exchangeRate={0.05}
        checkout={activeCheckout}
        onCreate={vi.fn()}
        origin={origin}
        destination={destination}
        onSendEmail={vi.fn()}
        isLoading={false}
        isSendingEmail={false}
      />,
    );

    expect(screen.getByText("$35.50 USD")).toBeInTheDocument();
    // 35.50 / 0.05 = 710 MXN
    expect(screen.getByText(/≈ \$710.00 MXN/)).toBeInTheDocument();
  });
});

