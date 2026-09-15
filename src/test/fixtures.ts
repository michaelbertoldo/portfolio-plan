import type { PublicStatus, SnapshotResult } from "../statusSchema";

export function healthySnapshot(
  overrides: Partial<PublicStatus> = {},
): PublicStatus {
  return {
    generated_at: new Date().toISOString(),
    freshness: { state: "fresh", age_seconds: 0, stale_after_seconds: 345600 },
    operating_mode: "SHADOW",
    strategy: { name: "Cross-Asset Momentum", version: "1.0.0" },
    universe: ["SPY", "QQQ", "IWM", "DIA", "TLT", "GLD"],
    evaluation: {
      qualifying_sessions: { completed: 18, required: 60 },
      month_end_cycles: { completed: 1, required: 2 },
      latest_successful_session: "2026-09-14",
    },
    portfolio: {
      equity: 510,
      cash: 255,
      gross_exposure: 0.5,
      drawdown: -0.01,
      positions: [{ symbol: "SPY", weight: 0.5 }],
    },
    operational_health: {
      reconciliation_accepted: true,
      unresolved_error_count: 0,
      open_alert_count: 0,
      duplicate_proposal_count: 0,
      risk_pause_active: false,
    },
    phase_gate_progress: {
      historical_research: "complete",
      forward_shadow_evaluation: "active",
      paper_evaluation: "locked",
      live_consideration: "unavailable",
    },
    ...overrides,
  };
}

export function result(snapshot = healthySnapshot()): SnapshotResult {
  return { snapshot, isFixture: false };
}
