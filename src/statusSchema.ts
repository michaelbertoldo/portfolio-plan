import { z } from "zod";

const etf = z.enum(["SPY", "QQQ", "IWM", "DIA", "TLT", "GLD"]);

const progressMetric = z
  .object({
    completed: z.number().int().nonnegative(),
    required: z.number().int().positive(),
  })
  .strict();

export const publicStatusSchema = z
  .object({
    generated_at: z.iso.datetime({ offset: true }),
    freshness: z
      .object({
        state: z.enum(["fresh", "stale"]),
        age_seconds: z.number().int().nonnegative(),
        stale_after_seconds: z.number().int().positive(),
      })
      .strict(),
    operating_mode: z.literal("SHADOW"),
    strategy: z
      .object({
        name: z.literal("Cross-Asset Momentum"),
        version: z.literal("1.0.0"),
      })
      .strict(),
    universe: z.tuple([
      z.literal("SPY"),
      z.literal("QQQ"),
      z.literal("IWM"),
      z.literal("DIA"),
      z.literal("TLT"),
      z.literal("GLD"),
    ]),
    evaluation: z
      .object({
        qualifying_sessions: progressMetric,
        month_end_cycles: progressMetric,
        latest_successful_session: z.iso.date(),
      })
      .strict(),
    portfolio: z
      .object({
        equity: z.number().positive(),
        cash: z.number().nonnegative(),
        gross_exposure: z.number().min(0).max(1),
        drawdown: z.number().min(-1).max(0),
        positions: z.array(
          z
            .object({
              symbol: etf,
              weight: z.number().min(0).max(1),
            })
            .strict(),
        ),
      })
      .strict(),
    operational_health: z
      .object({
        reconciliation_accepted: z.boolean(),
        unresolved_error_count: z.number().int().nonnegative(),
        open_alert_count: z.number().int().nonnegative(),
        duplicate_proposal_count: z.number().int().nonnegative(),
        risk_pause_active: z.boolean(),
      })
      .strict(),
    phase_gate_progress: z
      .object({
        historical_research: z.literal("complete"),
        forward_shadow_evaluation: z.enum(["active", "complete"]),
        paper_evaluation: z.literal("locked"),
        live_consideration: z.literal("unavailable"),
      })
      .strict(),
  })
  .strict();

export const fixtureEnvelopeSchema = z
  .object({
    fixture: z.literal(true),
    label: z.literal("DEMONSTRATION DATA — NOT GENUINE FORWARD EVIDENCE"),
    snapshot: publicStatusSchema,
  })
  .strict();

export type PublicStatus = z.infer<typeof publicStatusSchema>;

export type SnapshotResult = {
  snapshot: PublicStatus;
  isFixture: boolean;
  fixtureLabel?: string;
};

export function clampProgress(completed: number, required: number): number {
  if (required <= 0) return 0;
  return Math.min(Math.max(completed, 0), required);
}

export function isSnapshotStale(
  snapshot: PublicStatus,
  now = Date.now(),
): boolean {
  const elapsed = Math.max(
    0,
    Math.floor((now - Date.parse(snapshot.generated_at)) / 1000),
  );
  return (
    snapshot.freshness.state === "stale" ||
    Math.max(elapsed, snapshot.freshness.age_seconds) >
      snapshot.freshness.stale_after_seconds
  );
}
