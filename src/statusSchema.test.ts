import { describe, expect, it } from "vitest";

import fixture from "./fixtures/public-status.fixture.json";
import { fixtureEnvelopeSchema, publicStatusSchema } from "./statusSchema";
import { healthySnapshot } from "./test/fixtures";

describe("public status safety schema", () => {
  it("requires the fixture to carry an unmistakable demonstration label", () => {
    const parsed = fixtureEnvelopeSchema.parse(fixture);
    expect(parsed.fixture).toBe(true);
    expect(parsed.label).toBe(
      "DEMONSTRATION DATA — NOT GENUINE FORWARD EVIDENCE",
    );
  });

  it("rejects malformed input that attempts to activate PAPER", () => {
    const malformed = {
      ...healthySnapshot(),
      phase_gate_progress: {
        ...healthySnapshot().phase_gate_progress,
        paper_evaluation: "active",
      },
    };
    expect(() => publicStatusSchema.parse(malformed)).toThrow();
  });

  it("rejects malformed input that attempts to activate LIVE", () => {
    const malformed = {
      ...healthySnapshot(),
      phase_gate_progress: {
        ...healthySnapshot().phase_gate_progress,
        live_consideration: "active",
      },
    };
    expect(() => publicStatusSchema.parse(malformed)).toThrow();
  });

  it("rejects non-SHADOW operating modes and extra private fields", () => {
    expect(() =>
      publicStatusSchema.parse({
        ...healthySnapshot(),
        operating_mode: "PAPER",
      }),
    ).toThrow();
    expect(() =>
      publicStatusSchema.parse({ ...healthySnapshot(), run_id: "private" }),
    ).toThrow();
  });
});
