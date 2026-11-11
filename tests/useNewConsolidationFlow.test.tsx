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

const FREE = trailer("free", []);
const BUSY = trailer("busy", ["MX-01"]);

function trailer(id: string, openInFolios: string[]) {
  return {
    id,
    unitNumber: `T-${id}`,
    type: "Tráiler 53",
    plates: `P-${id}`,
    capacityLinearFeet: id === "free" ? 48 : 53,
    isActive: true,
    sealedInFolios: [],
    openInFolios,
    occupiedLinearFeet: null,
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
    trailerInUseBy: [],
  });
});

describe("useNewConsolidationFlow", () => {
  it("?trailerId= de un tráiler libre lo preselecciona con su capacidad", async () => {
    const { result } = mount("/consolidations/new?trailerId=free");

    await waitFor(() => expect(result.current.form.getValues("trailerId")).toBe("free"));
    expect(result.current.form.getValues("capacityLinearFeet")).toBe("48");
    expect(result.current.trailerToConfirm).toBeNull();
  });

  it("?trailerId= de un tráiler en uso pide confirmación y, si se cancela, no vuelve a pedirla", async () => {
    const { result, rerender } = mount("/consolidations/new?trailerId=busy");

    await waitFor(() => expect(result.current.trailerToConfirm?.id).toBe("busy"));
    expect(result.current.form.getValues("trailerId")).toBe("");

    act(() => result.current.cancelTrailer());
    rerender();

    expect(result.current.trailerToConfirm).toBeNull();
    expect(result.current.form.getValues("trailerId")).toBe("");
  });

  it("elegir un tráiler en uso no lo asigna hasta confirmar", () => {
    const { result } = mount();

    act(() => result.current.selectTrailer("busy"));
    expect(result.current.trailerToConfirm?.id).toBe("busy");
    expect(result.current.form.getValues("trailerId")).toBe("");

    act(() => result.current.confirmTrailer());
    expect(result.current.trailerToConfirm).toBeNull();
    expect(result.current.form.getValues("trailerId")).toBe("busy");
  });

  it("al crear sólo avisa de los folios que no se confirmaron", async () => {
    createConsolidation.mockResolvedValue({
      consolidation: { id: "c-1", folio: "MX-02" },
      trailerInUseBy: ["MX-01", "MX-09"],
    });
    const { result } = mount();
    act(() => result.current.selectTrailer("busy"));
    act(() => result.current.confirmTrailer());
    fillDetails(result);

    await act(() => result.current.handleCreate());

    expect(toast.warning).toHaveBeenCalledTimes(1);
    expect(toast.warning.mock.calls[0][0]).toContain("MX-09");
    expect(toast.warning.mock.calls[0][0]).not.toContain("MX-01");
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
