import { CloverCheckoutPanel } from "@contexts/order-flow/ui/components/order/orders-table/CloverCheckoutPanel";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

describe("CloverCheckoutPanel", () => {
  it("lets the employee create a flexible partial USD payment link", async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(
      <CloverCheckoutPanel
        outstanding={80}
        checkout={null}
        onCreate={onCreate}
        isLoading={false}
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

  it("shows an active link returned by Clover", () => {
    render(
      <CloverCheckoutPanel
        outstanding={80}
        checkout={{
          id: "checkout-1",
          orderId: "order-1",
          checkoutSessionId: "session-1",
          publicToken: "public-1",
          href: "https://checkout.clover.test/session-1",
          amount: { amount: 35.5, currency: "USD" },
          status: "PENDING",
          cloverPaymentId: null,
          createdBy: "user-1",
          expiresAt: "2099-08-19T18:15:00.000Z",
          createdAt: "2099-08-19T18:00:00.000Z",
          updatedAt: "2099-08-19T18:00:00.000Z",
        }}
        onCreate={vi.fn()}
        isLoading={false}
      />,
    );

    expect(screen.getByRole("link", { name: "Abrir enlace" })).toHaveAttribute(
      "href",
      "https://checkout.clover.test/session-1",
    );
    expect(screen.getByText("$35.50 USD")).toBeInTheDocument();
  });
});
