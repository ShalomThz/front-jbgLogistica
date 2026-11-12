import { describe, expect, it } from "vitest";
import { countVerification } from "@contexts/consolidation/domain/countVerification";

const orders = (...statuses: ("PENDING" | "REVIEWED" | "ALERT")[]) =>
  statuses.map((verificationStatus) => ({ verificationStatus }));

describe("countVerification", () => {
  it("el porcentaje sólo cuenta las revisadas, no las alertas", () => {
    expect(countVerification(orders("REVIEWED", "ALERT", "PENDING", "REVIEWED"))).toEqual({
      total: 4,
      reviewed: 2,
      alert: 1,
      pending: 1,
      reviewedPct: 50,
    });
  });

  it("sin órdenes da 0%", () => {
    expect(countVerification([]).reviewedPct).toBe(0);
  });
});
