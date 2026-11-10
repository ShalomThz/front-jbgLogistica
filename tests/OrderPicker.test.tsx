import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrderPicker, type SelectedOrder } from "@contexts/consolidation/ui/components/OrderPicker";

const { find } = vi.hoisted(() => ({ find: vi.fn() }));
vi.mock("@contexts/sales/infrastructure/services/orders/orderRepository", () => ({ orderRepository: { find } }));
vi.mock("@contexts/consolidation/ui/components/TruckVisual", () => ({ TruckVisual: () => null }));
vi.mock("@contexts/shared/infrastructure/hooks/useDebouncedValue", () => ({ useDebouncedValue: (value: string) => value }));

function order(id: string) {
  return {
    id, consolidationId: null,
    destination: { name: `Cliente ${id}`, company: "", address: { city: "Puebla" } },
    store: { name: "Tienda" },
    references: { orderNumber: `JBG-${id}`, partnerOrderNumber: null },
    package: { dimensions: { height: 10, width: 10, length: 10 } },
  };
}
function page(ids: string[], offset = 0, hasMore = false) {
  return { data: ids.map(order), pagination: { total: hasMore ? 300 : offset + ids.length, limit: 50, offset, hasMore } };
}
function Picker() {
  const [selected, onChange] = useState<SelectedOrder[]>([]);
  return <OrderPicker selected={selected} onChange={onChange} capacityLinearFeet={53} />;
}
function mount() {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><Picker /></QueryClientProvider>);
}
beforeEach(() => {
  find.mockReset();
  window.matchMedia = vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn() });
});
describe("OrderPicker", () => {
  it("carga páginas adicionales y mantiene las órdenes anteriores", async () => {
    find.mockResolvedValueOnce(page(["1"], 0, true)).mockResolvedValueOnce(page(["2"], 1));
    mount();
    fireEvent.click(await screen.findByRole("button", { name: "Cargar más órdenes" }));
    expect(await screen.findByText("Cliente 2")).toBeInTheDocument();
    expect(screen.getByText("Cliente 1")).toBeInTheDocument();
    expect(find.mock.calls[1][0]).toMatchObject({ limit: 50, offset: 1 });
    expect(screen.queryByRole("button", { name: "Cargar más órdenes" })).not.toBeInTheDocument();
  });
  it("busca en el back desde cero y conserva la selección con su referencia", async () => {
    find.mockImplementation((request) => Promise.resolve(request.search ? page(["999"]) : page(["1"], 0, true)));
    mount();
    fireEvent.click(await screen.findByText("Cliente 1"));
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "JBG-999" } });
    expect(await screen.findByText("Cliente 999")).toBeInTheDocument();
    expect(screen.queryByText("Cliente 1")).not.toBeInTheDocument();
    expect(screen.getByText("JBG-1")).toBeInTheDocument();
    expect(screen.getByText("1 orden seleccionada")).toBeInTheDocument();
    await waitFor(() => expect(find).toHaveBeenLastCalledWith(expect.objectContaining({
      search: "JBG-999", offset: 0,
      filters: [
        { field: "consolidationId", filterOperator: "IS_NULL", value: null },
        { field: "status", filterOperator: "=", value: "COMPLETED" },
      ],
    })));
  });
});
