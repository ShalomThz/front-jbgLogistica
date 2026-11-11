import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  useConsolidation,
  useConsolidationActions,
} from "@contexts/consolidation/infrastructure/hooks/useConsolidation";
import { consolidationKeys } from "@contexts/consolidation/infrastructure/hooks/consolidationKeys";

const { getById, updateOrderComments } = vi.hoisted(() => ({
  getById: vi.fn(),
  updateOrderComments: vi.fn(),
}));

vi.mock("@contexts/consolidation/infrastructure/services/consolidationRepository", () => ({
  consolidationRepository: { getById, updateOrderComments },
}));

const REQUEST = {
  comments: [
    { orderId: "o-1", comment: "nuevo", verifiedByUserId: null, verificationStatus: "PENDING" },
  ],
} as never;

/** La recarga tarda: si `mutateAsync` no la esperara, resolvería antes. */
const slowly = <T,>(value: T) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(value), 20));

/** El detalle y las acciones montados juntos, como en la página. */
async function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(
    () => ({ detail: useConsolidation("c-1"), actions: useConsolidationActions("c-1") }),
    { wrapper },
  );
  await waitFor(() => expect(result.current.detail.data).toEqual({ comment: "viejo" }));
  // Lo que verá el siguiente render de la página: la caché del detalle.
  const cachedDetail = () => client.getQueryData(consolidationKeys.detail("c-1"));
  return { actions: () => result.current.actions, cachedDetail };
}

beforeEach(() => {
  vi.clearAllMocks();
  getById.mockResolvedValueOnce({ comment: "viejo" });
});

describe("useConsolidationActions", () => {
  it("resuelve con el detalle ya recargado", async () => {
    const { actions, cachedDetail } = await mount();
    updateOrderComments.mockResolvedValue({});
    getById.mockImplementationOnce(() => slowly({ comment: "nuevo" }));

    await act(() => actions().updateOrderComments(REQUEST));

    expect(getById).toHaveBeenCalledTimes(2);
    expect(cachedDetail()).toEqual({ comment: "nuevo" });
  });

  it("también recarga el detalle cuando el guardado falla", async () => {
    const { actions, cachedDetail } = await mount();
    updateOrderComments.mockRejectedValue(new Error("conflicto"));
    getById.mockImplementationOnce(() => slowly({ comment: "de otro usuario" }));

    await act(() =>
      expect(actions().updateOrderComments(REQUEST)).rejects.toThrow("conflicto"),
    );

    expect(cachedDetail()).toEqual({ comment: "de otro usuario" });
  });
});
