import { useColumnVisibility } from "@contexts/shared/infrastructure/hooks/useColumnVisibility";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const KEY = "jbg:hidden-columns:orders";

beforeEach(() => {
  localStorage.clear();
});

describe("useColumnVisibility", () => {
  it("arranca sin nada oculto", () => {
    const { result } = renderHook(() => useColumnVisibility("orders"));

    expect(result.current.hiddenCount).toBe(0);
    expect(result.current.isHidden("customer")).toBe(false);
  });

  it("oculta y vuelve a mostrar la misma columna", () => {
    const { result } = renderHook(() => useColumnVisibility("orders"));

    act(() => result.current.toggle("customer"));
    expect(result.current.isHidden("customer")).toBe(true);
    expect(result.current.hiddenCount).toBe(1);

    act(() => result.current.toggle("customer"));
    expect(result.current.isHidden("customer")).toBe(false);
    expect(result.current.hiddenCount).toBe(0);
  });

  it("guarda las ocultas, no las visibles", () => {
    const { result } = renderHook(() => useColumnVisibility("orders"));

    act(() => result.current.toggle("customer"));

    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual(["customer"]);
  });

  it("recupera la preferencia al volver a montar", () => {
    const first = renderHook(() => useColumnVisibility("orders"));
    act(() => first.result.current.toggle("tracking"));
    first.unmount();

    const second = renderHook(() => useColumnVisibility("orders"));
    expect(second.result.current.isHidden("tracking")).toBe(true);
  });

  it("cada tabla guarda lo suyo", () => {
    const orders = renderHook(() => useColumnVisibility("orders"));
    act(() => orders.result.current.toggle("customer"));

    const tariffs = renderHook(() => useColumnVisibility("tariffs"));
    expect(tariffs.result.current.isHidden("customer")).toBe(false);
  });

  it("'mostrar todas' limpia la preferencia", () => {
    const { result } = renderHook(() => useColumnVisibility("orders"));

    act(() => result.current.toggle("customer"));
    act(() => result.current.toggle("tracking"));
    expect(result.current.hiddenCount).toBe(2);

    act(() => result.current.showAll());
    expect(result.current.hiddenCount).toBe(0);
  });

  describe("tolerancia a lo que haya en el storage", () => {
    it("un JSON corrupto no rompe la tabla", () => {
      localStorage.setItem(KEY, "{no es json");

      const { result } = renderHook(() => useColumnVisibility("orders"));
      expect(result.current.hiddenCount).toBe(0);
    });

    it("un valor que no es lista se descarta", () => {
      localStorage.setItem(KEY, JSON.stringify({ customer: true }));

      const { result } = renderHook(() => useColumnVisibility("orders"));
      expect(result.current.hiddenCount).toBe(0);
    });

    it("de una lista mixta se rescatan solo los ids", () => {
      localStorage.setItem(KEY, JSON.stringify(["customer", 42, null]));

      const { result } = renderHook(() => useColumnVisibility("orders"));
      expect(result.current.hiddenCount).toBe(1);
      expect(result.current.isHidden("customer")).toBe(true);
    });

    it("sigue andando cuando el storage no deja escribir", () => {
      const setItem = vi
        .spyOn(Storage.prototype, "setItem")
        .mockImplementation(() => {
          throw new Error("QuotaExceededError");
        });

      const { result } = renderHook(() => useColumnVisibility("orders"));
      expect(() => act(() => result.current.toggle("customer"))).not.toThrow();
      expect(result.current.isHidden("customer")).toBe(true);

      setItem.mockRestore();
    });
  });
});
