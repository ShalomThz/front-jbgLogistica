import { timelineStages } from "@contexts/shipping/domain/services/timelineStages";
import { describe, expect, it } from "vitest";

describe("timelineStages", () => {
  it("con agente y flota JBG, las ocho etapas", () => {
    expect(timelineStages({ hasAgentStage: true, viaCarrier: false })).toEqual([
      "AGENT",
      "ORIGIN_WAREHOUSE",
      "DISPATCHED",
      "IN_TRANSIT",
      "DESTINATION_WAREHOUSE",
      "DISTRIBUTION",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
    ]);
  });

  it("omite lo que nunca va a ocurrir, en vez de dejarlo pendiente para siempre", () => {
    const stages = timelineStages({ hasAgentStage: false, viaCarrier: true });
    expect(stages).not.toContain("AGENT");
    expect(stages).not.toContain("DESTINATION_WAREHOUSE");
  });

  it("la etapa actual siempre está, aunque las banderas digan que no aplica", () => {
    const stages = timelineStages(
      { hasAgentStage: false, viaCarrier: true },
      "DESTINATION_WAREHOUSE",
    );
    expect(stages).toContain("DESTINATION_WAREHOUSE");
  });
});
