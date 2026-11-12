import { describe, expect, it } from "vitest";
import {
  departureFromInput,
  departureToInput,
} from "@contexts/consolidation/domain/departureDate";

describe("departureDate", () => {
  it("el día capturado vuelve igual, sin correrse por la zona horaria", () => {
    const iso = departureFromInput("2026-11-14");
    expect(iso).not.toBeNull();
    expect(departureToInput(iso)).toBe("2026-11-14");
  });

  it("vacío es sin fecha", () => {
    expect(departureFromInput("")).toBeNull();
    expect(departureToInput(null)).toBe("");
  });
});
