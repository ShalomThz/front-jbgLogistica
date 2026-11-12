import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useNewConsolidationFlow } from "@contexts/consolidation/ui/hooks/useNewConsolidationFlow";

const { trailers, createConsolidation, addOrders, toast, permissions } = vi.hoisted(() => ({
  trailers: { current: [] as unknown[] },
  createConsolidation: vi.fn(),
  addOrders: vi.fn(),
  toast: { warning: vi.fn(), error: vi.fn(), success: vi.fn() },
  permissions: { current: [] as string[] },
}));

vi.mock("@contexts/consolidation/infrastructure/hooks/useTrailers", () => ({
  useTrailers: () => ({ trailers: trailers.current }),
}));
vi.mock("@contexts/consolidation/infrastructure/hooks/useCreateConsolidation", () => ({
  useCreateConsolidation: () => ({ createConsolidation }),
}));
vi.mock("@contexts/consolidation/infrastructure/services/consolidationRepository", () => ({
  consolidationRepository: { addOrders },
}));
vi.mock("@contexts/iam/infrastructure/hooks/auth/useAuth", () => ({
  useAuth: () => ({ user: { role: { permissions: permissions.current } } }),
}));
vi.mock("sonner", () => ({ toast }));

const FREE = trailer("free", null);
const BUSY = trailer("busy", "MX-01");

function trailer(id: string, busyIn: string | null) {
  return {
    id,
    unitNumber: `T-${id}`,
    type: "Tráiler 53",
    plates: `P-${id}`,
    capacityLinearFeet: id === "free" ? 48 : 53,
    isActive: true,
    sealedInFolios: [],
    activeConsolidation: busyIn
      ? { id: `c-${busyIn}`, folio: busyIn, linearFeet: 10, plannedDepartureAt: null }
      : null,
  };
}

function mount(url = "/consolidations/new") {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>
  );
  return renderHook(() => useNewConsolidationFlow(), { wrapper });
}

/** Llena el paso 1 con datos válidos. */
function fillDetails(result: ReturnType<typeof mount>["result"]) {
  const { setValue } = result.current.form;
  setValue("folio", "MX-02");
  setValue("origin", "LA");
  setValue("destination", "CDMX");
}

beforeEach(() => {
  vi.clearAllMocks();
  trailers.current = [FREE, BUSY];
  permissions.current = [
    "CAN_CREATE_CONSOLIDATIONS",
    "CAN_VIEW_CONSOLIDATIONS",
    "CAN_MANAGE_CONSOLIDATION_PACKAGES",
  ];
  createConsolidation.mockResolvedValue({
    consolidation: { id: "c-1", folio: "MX-02" },
  });
});

describe("useNewConsolidationFlow", () => {
  it("?trailerId= de un tráiler libre lo preselecciona con su capacidad", async () => {
    const { result } = mount("/consolidations/new?trailerId=free");

    await waitFor(() => expect(result.current.form.getValues("trailerId")).toBe("free"));
    expect(result.current.form.getValues("capacityLinearFeet")).toBe("48");
  });

  it("?trailerId= de un tráiler ocupado no lo preselecciona y avisa en qué consolidado va", async () => {
    const { result } = mount("/consolidations/new?trailerId=busy");

    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    expect(toast.error.mock.calls[0][0]).toContain("MX-01");
    expect(result.current.form.getValues("trailerId")).toBe("");
  });

  it("un tráiler ocupado no se puede elegir", () => {
    const { result } = mount();

    act(() => result.current.selectTrailer("busy"));

    expect(result.current.form.getValues("trailerId")).toBe("");
  });

  it("si la unidad elegida queda ocupada por otro, se suelta y se vuelve a datos", async () => {
    const { result, rerender } = mount();
    act(() => result.current.selectTrailer("free"));
    fillDetails(result);
    await act(() => result.current.handleNext());
    expect(result.current.step).toBe("ordenes");

    // El catálogo se recarga: otra persona creó un consolidado con ella.
    trailers.current = [trailer("free", "MX-77"), BUSY];
    rerender();

    await waitFor(() => expect(result.current.form.getValues("trailerId")).toBe(""));
    expect(result.current.form.getFieldState("trailerId").error?.message).toContain("MX-77");
    expect(result.current.step).toBe("datos");
  });

  it("después de crear, ver la unidad en el consolidado propio no la suelta", async () => {
    const { result, rerender } = mount();
    act(() => result.current.selectTrailer("free"));
    fillDetails(result);
    await act(() => result.current.handleCreate());

    trailers.current = [trailer("free", "MX-02"), BUSY];
    rerender();

    expect(result.current.form.getValues("trailerId")).toBe("free");
    expect(result.current.form.getFieldState("trailerId").error).toBeUndefined();
  });

  it("un doble clic en crear crea un solo consolidado", async () => {
    const { result } = mount();
    act(() => result.current.selectTrailer("free"));
    fillDetails(result);

    await act(() => Promise.all([result.current.handleCreate(), result.current.handleCreate()]));

    expect(createConsolidation).toHaveBeenCalledTimes(1);
  });

  it("sin permiso de cargar órdenes, el paso de órdenes no existe", () => {
    permissions.current = ["CAN_CREATE_CONSOLIDATIONS", "CAN_VIEW_CONSOLIDATIONS"];
    const { result } = mount();

    expect(result.current.steps.map((s) => s.key)).toEqual(["datos", "revisar"]);
    expect(result.current.canManageOrders).toBe(false);
  });
});
