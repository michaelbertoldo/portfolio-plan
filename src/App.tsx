import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import { SnapshotUnavailableError, loadPublicSnapshot } from "./statusClient";
import {
  clampProgress,
  isSnapshotStale,
  type PublicStatus,
  type SnapshotResult,
} from "./statusSchema";

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; result: SnapshotResult }
  | { kind: "unavailable"; message: string }
  | { kind: "error"; message: string };

type AppProps = {
  loadSnapshot?: () => Promise<SnapshotResult>;
};

const historicalMetrics = [
  ["Return", "75.57%"],
  ["CAGR", "23.54%"],
  ["Sharpe", "1.398"],
  ["Max drawdown", "−12.92%"],
  ["Turnover", "12.45×"],
  ["Completed trades", "11"],
] as const;

const architecture = [
  ["01", "Market data", "Alpaca IEX primary + Yahoo secondary"],
  ["02", "Data assurance", "Validation + provider reconciliation"],
  ["03", "Decision system", "Frozen cross-asset momentum v1.0.0"],
  ["04", "Risk boundary", "Independent, fail-closed risk engine"],
  ["05", "Evidence", "SQLite append-oriented operations ledger"],
  ["06", "Public boundary", "Strictly sanitized status exporter"],
  ["07", "Experience", "Read-only public dashboard"],
] as const;

const safeguards = [
  [
    "CAL",
    "Official XNYS calendar",
    "Session-aware scheduling follows exchange closes, holidays, and early closes.",
  ],
  [
    "REC",
    "Provider reconciliation",
    "Independent adjusted-data sources must agree inside a strict tolerance.",
  ],
  [
    "ID",
    "Deterministic identifiers",
    "Stable proposal identities make retries auditable and idempotent.",
  ],
  [
    "DUP",
    "Duplicate-cycle prevention",
    "Repeated runs cannot duplicate proposals, cycles, or hypothetical fills.",
  ],
  [
    "LOCK",
    "Process locking",
    "An OS-enforced nonblocking lock prevents overlapping launchers.",
  ],
  [
    "RST",
    "Restart recovery",
    "Interrupted work resumes from durable state without fabricating evidence.",
  ],
  [
    "WAL",
    "WAL-aware backups",
    "Online backups include integrity checks and SHA-256 manifests.",
  ],
  [
    "GIT",
    "Clean-worktree provenance",
    "Forward runs require clean, attributable source state.",
  ],
  [
    "SAFE",
    "Persistent kill switch",
    "PAPER begins locked and remains separate from SHADOW evaluation.",
  ],
  [
    "ZERO",
    "Broker-free SHADOW",
    "The SHADOW launcher has no order adapter or submission capability.",
  ],
] as const;

function Icon({ children }: { children: ReactNode }) {
  return (
    <span className="micro-icon" aria-hidden="true">
      {children}
    </span>
  );
}

function Badge({
  tone,
  children,
}: {
  tone: "blue" | "green" | "muted";
  children: ReactNode;
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function ShellHeader() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="QuantFinanceLearn home">
          <span className="brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>
            QFL<span className="brand-dim"> / RESEARCH</span>
          </span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#evaluation">Evaluation</a>
          <a href="#research">Research</a>
          <a href="#architecture">Architecture</a>
          <a href="#safety">Safety</a>
        </nav>
        <a
          className="repo-link"
          href="https://github.com/michaelbertoldo/QuantFinanceLearn"
          target="_blank"
          rel="noreferrer"
        >
          View repository <span aria-hidden="true">↗</span>
        </a>
      </header>
    </>
  );
}

function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero-grid" aria-hidden="true" />
      <div className="hero-orbit" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="hero-copy reveal">
        <div className="eyebrow">
          <span className="pulse-dot" /> Quantitative systems case study
        </div>
        <h1>
          Algorithmic Trading
          <br />
          <span>Research Platform</span>
        </h1>
        <p>
          A disciplined research and forward-evaluation system built to test a
          frozen strategy, preserve evidence, and keep risk boundaries explicit.
        </p>
        <div className="hero-badges">
          <Badge tone="blue">SHADOW EVALUATION</Badge>
          <Badge tone="green">NO LIVE TRADING</Badge>
        </div>
      </div>
      <div className="hero-rail reveal reveal-delay">
        <span>Built with</span>
        <ul aria-label="Core technologies">
          <li>Python</li>
          <li>Alpaca</li>
          <li>SQLite</li>
          <li>XNYS</li>
          <li>Quantitative research</li>
        </ul>
      </div>
    </section>
  );
}

function SectionHeading({
  eyebrow,
  title,
  copy,
}: {
  eyebrow: string;
  title: string;
  copy?: string;
}) {
  return (
    <div className="section-heading">
      <p className="eyebrow">{eyebrow}</p>
      <div>
        <h2>{title}</h2>
        {copy && <p>{copy}</p>}
      </div>
    </div>
  );
}

function PhaseProgress({ snapshot }: { snapshot: PublicStatus }) {
  const phases = [
    [
      "01",
      "Historical research",
      snapshot.phase_gate_progress.historical_research,
    ],
    [
      "02",
      "Forward SHADOW evaluation",
      snapshot.phase_gate_progress.forward_shadow_evaluation,
    ],
    ["03", "PAPER evaluation", snapshot.phase_gate_progress.paper_evaluation],
    [
      "04",
      "Live consideration",
      snapshot.phase_gate_progress.live_consideration,
    ],
  ] as const;
  return (
    <ol className="phase-track" aria-label="Research phase progression">
      {phases.map(([number, label, state]) => (
        <li className={`phase phase-${state}`} key={number}>
          <div className="phase-node">
            <span>{number}</span>
          </div>
          <div className="phase-copy">
            <span>{label}</span>
            <strong>{state}</strong>
          </div>
        </li>
      ))}
    </ol>
  );
}

function ProgressGauge({
  label,
  completed,
  required,
}: {
  label: string;
  completed: number;
  required: number;
}) {
  const visualValue = clampProgress(completed, required);
  const percentage = Math.round((visualValue / required) * 100);
  return (
    <div className="progress-gauge">
      <div
        className="gauge-ring"
        style={{ "--progress": `${percentage * 3.6}deg` } as CSSProperties}
        role="img"
        aria-label={`${label}: ${completed} of ${required}, ${percentage}% complete`}
      >
        <span>
          <strong>{completed}</strong>
          <small>/ {required}</small>
        </span>
      </div>
      <div>
        <strong>{label}</strong>
        <span>{percentage}% of gate</span>
      </div>
      <progress max={required} value={visualValue}>
        {percentage}%
      </progress>
    </div>
  );
}

function HealthItem({
  label,
  value,
  good,
}: {
  label: string;
  value: string;
  good: boolean;
}) {
  return (
    <li>
      <span
        className={`health-dot ${good ? "health-good" : "health-warn"}`}
        aria-hidden="true"
      />
      <span>{label}</span>
      <strong>{value}</strong>
    </li>
  );
}

function formatTimestamp(value: string) {
  return (
    new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC",
    }).format(new Date(value)) + " UTC"
  );
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function EvaluationPanel({ result }: { result: SnapshotResult }) {
  const { snapshot } = result;
  const stale = isSnapshotStale(snapshot);
  const health = snapshot.operational_health;
  const healthy =
    health.reconciliation_accepted &&
    health.unresolved_error_count === 0 &&
    health.open_alert_count === 0 &&
    health.duplicate_proposal_count === 0 &&
    !health.risk_pause_active;

  return (
    <>
      {result.isFixture && (
        <div className="fixture-banner" role="note">
          <Icon>DEV</Icon>
          {result.fixtureLabel}
        </div>
      )}
      {stale && !result.isFixture && (
        <div className="stale-banner" role="alert">
          <Icon>!</Icon>
          <div>
            <strong>Public snapshot is stale</strong>
            <span>
              The display remains read-only. Verify the next sanitized
              publication before relying on current progress.
            </span>
          </div>
        </div>
      )}
      <PhaseProgress snapshot={snapshot} />
      <div className="evaluation-grid">
        <article className="panel evaluation-card">
          <div className="panel-topline">
            <span>Forward evidence</span>
            <Badge tone={stale ? "muted" : "blue"}>
              {stale ? "STALE" : "CURRENT"}
            </Badge>
          </div>
          <h3>Current evaluation</h3>
          <div className="gauge-grid">
            <ProgressGauge
              label="Qualifying sessions"
              {...snapshot.evaluation.qualifying_sessions}
            />
            <ProgressGauge
              label="Month-end cycles"
              {...snapshot.evaluation.month_end_cycles}
            />
          </div>
          <dl className="verified-row">
            <div>
              <dt>Latest verified session</dt>
              <dd>{snapshot.evaluation.latest_successful_session}</dd>
            </div>
            <div>
              <dt>Operating mode</dt>
              <dd>{snapshot.operating_mode}</dd>
            </div>
          </dl>
        </article>

        <article className="panel health-card">
          <div className="panel-topline">
            <span>Operational health</span>
            <span className={`health-label ${healthy ? "is-good" : "is-warn"}`}>
              <i />
              {healthy ? "HEALTHY" : "ATTENTION"}
            </span>
          </div>
          <h3>Evidence integrity</h3>
          <ul className="health-list">
            <HealthItem
              label="Provider reconciliation"
              value={
                health.reconciliation_accepted ? "Accepted" : "Not accepted"
              }
              good={health.reconciliation_accepted}
            />
            <HealthItem
              label="Unresolved errors"
              value={String(health.unresolved_error_count)}
              good={health.unresolved_error_count === 0}
            />
            <HealthItem
              label="Open alerts"
              value={String(health.open_alert_count)}
              good={health.open_alert_count === 0}
            />
            <HealthItem
              label="Duplicate proposals"
              value={String(health.duplicate_proposal_count)}
              good={health.duplicate_proposal_count === 0}
            />
            <HealthItem
              label="Risk pause"
              value={health.risk_pause_active ? "Active" : "Inactive"}
              good={!health.risk_pause_active}
            />
          </ul>
          <p className="updated">
            <span>Snapshot generated</span>
            <time dateTime={snapshot.generated_at}>
              {formatTimestamp(snapshot.generated_at)}
            </time>
          </p>
        </article>
      </div>

      <PortfolioPanel snapshot={snapshot} />
    </>
  );
}

function PortfolioPanel({ snapshot }: { snapshot: PublicStatus }) {
  const portfolio = snapshot.portfolio;
  return (
    <article className="panel portfolio-panel">
      <div className="portfolio-head">
        <div>
          <div className="panel-topline">
            <span>Hypothetical accounting only</span>
          </div>
          <h3>SHADOW portfolio</h3>
        </div>
        <Badge tone="muted">NOT BROKER ASSETS</Badge>
      </div>
      <dl className="portfolio-stats">
        <div>
          <dt>Starting capital</dt>
          <dd>$500.00</dd>
        </div>
        <div>
          <dt>Current equity</dt>
          <dd>{money(portfolio.equity)}</dd>
        </div>
        <div>
          <dt>Cash</dt>
          <dd>{money(portfolio.cash)}</dd>
        </div>
        <div>
          <dt>Gross exposure</dt>
          <dd>{(portfolio.gross_exposure * 100).toFixed(1)}%</dd>
        </div>
        <div>
          <dt>Current drawdown</dt>
          <dd>{(portfolio.drawdown * 100).toFixed(2)}%</dd>
        </div>
      </dl>
      <div className="positions-head">
        <span>Current positions and modeled weights</span>
        <span>Weight</span>
      </div>
      {portfolio.positions.length ? (
        <ul className="position-list">
          {portfolio.positions.map((position) => (
            <li key={position.symbol}>
              <strong>{position.symbol}</strong>
              <div className="weight-track" aria-hidden="true">
                <i
                  style={{ width: `${Math.min(position.weight * 100, 100)}%` }}
                />
              </div>
              <span>{(position.weight * 100).toFixed(1)}%</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-position">
          No hypothetical positions in the latest sanitized snapshot.
        </p>
      )}
    </article>
  );
}

function SnapshotState({
  state,
}: {
  state: Exclude<LoadState, { kind: "ready" }>;
}) {
  if (state.kind === "loading") {
    return (
      <div
        className="state-panel loading-state"
        role="status"
        aria-live="polite"
      >
        <span className="loader" aria-hidden="true" />
        <div>
          <strong>Loading sanitized evidence</strong>
          <span>Validating the public status contract…</span>
        </div>
      </div>
    );
  }
  const unavailable = state.kind === "unavailable";
  return (
    <div
      className={`state-panel ${unavailable ? "unavailable-state" : "error-state"}`}
      role="alert"
    >
      <Icon>{unavailable ? "—" : "!"}</Icon>
      <div>
        <strong>
          {unavailable
            ? "Forward status unavailable"
            : "Snapshot validation failed"}
        </strong>
        <span>{state.message}</span>
        <small>
          No private fallback is attempted. Historical research remains
          available below.
        </small>
      </div>
    </div>
  );
}

function HistoricalResearch() {
  return (
    <section className="content-section" id="research">
      <SectionHeading
        eyebrow="01 / Historical research"
        title="Locked-test performance"
        copy="Frozen cross-asset momentum v1.0.0 · 2024-01-01 through 2026-09-04"
      />
      <div className="warning-callout">
        <Icon>!</Icon>
        <div>
          <strong>Historical backtest—not a forecast.</strong>
          <span>
            Historical results use a 10 bps cost assumption and do not establish
            future profitability.
          </span>
        </div>
      </div>
      <div className="research-grid">
        <article className="panel metrics-panel">
          <div className="panel-topline">
            <span>Frozen strategy results</span>
            <span>LOCKED PERIOD</span>
          </div>
          <dl className="metric-grid">
            {historicalMetrics.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p className="cost-note">
            <span>Cost assumption</span>
            <strong>10 basis points</strong>
          </p>
        </article>
        <article className="panel comparison-panel">
          <div className="panel-topline">
            <span>Benchmark comparison</span>
            <span>SPY BUY &amp; HOLD</span>
          </div>
          <h3>Risk-adjusted context</h3>
          <div
            className="comparison-chart"
            role="img"
            aria-label="Historical strategy return 75.57 percent versus SPY return 68.5 percent; strategy Sharpe 1.398 versus SPY Sharpe 1.328; strategy maximum drawdown negative 12.92 percent versus SPY negative 18.8 percent."
          >
            <div className="chart-group">
              <span>Return</span>
              <div title="Strategy return: 75.57%">
                <i style={{ width: "75.57%" }} />
                <b>75.57%</b>
              </div>
              <div className="benchmark-bar" title="SPY return: 68.5%">
                <i style={{ width: "68.5%" }} />
                <b>68.5%</b>
              </div>
            </div>
            <div className="chart-group">
              <span>Sharpe</span>
              <div title="Strategy Sharpe: 1.398">
                <i style={{ width: "93.2%" }} />
                <b>1.398</b>
              </div>
              <div className="benchmark-bar" title="SPY Sharpe: 1.328">
                <i style={{ width: "88.5%" }} />
                <b>1.328</b>
              </div>
            </div>
            <div className="chart-group">
              <span>Maximum drawdown</span>
              <div title="Strategy maximum drawdown: -12.92%">
                <i style={{ width: "64.6%" }} />
                <b>−12.92%</b>
              </div>
              <div
                className="benchmark-bar"
                title="SPY maximum drawdown: -18.8%"
              >
                <i style={{ width: "94%" }} />
                <b>−18.8%</b>
              </div>
            </div>
          </div>
          <div className="chart-legend">
            <span>
              <i />
              Strategy v1.0.0
            </span>
            <span>
              <i />
              SPY buy &amp; hold
            </span>
          </div>
        </article>
      </div>
    </section>
  );
}

function StrategySection() {
  const rules = [
    ["Universe", "Six liquid ETFs", "SPY · QQQ · IWM · DIA · TLT · GLD"],
    [
      "Signal",
      "Monthly 6 / 12-month momentum",
      "Two horizons averaged into one relative score",
    ],
    [
      "Eligibility",
      "Positive momentum required",
      "Cash remains unallocated when evidence is weak",
    ],
    [
      "Concentration",
      "Maximum two holdings",
      "No more than 50% target weight per holding",
    ],
    [
      "Execution",
      "Next-session model",
      "Signals are separated from observable execution prices",
    ],
    [
      "Identity",
      "Frozen parameters",
      "Version 1.0.0 remains unchanged during evaluation",
    ],
  ] as const;
  return (
    <section className="content-section strategy-section">
      <SectionHeading
        eyebrow="02 / Strategy"
        title="Simple rules. Hard boundaries."
        copy="The research question stays fixed while the evidence accumulates."
      />
      <div className="rule-grid">
        {rules.map(([eyebrow, title, copy], index) => (
          <article className="rule-card" key={title}>
            <span>0{index + 1}</span>
            <p>{eyebrow}</p>
            <h3>{title}</h3>
            <small>{copy}</small>
          </article>
        ))}
      </div>
      <aside className="future-note">
        <Icon>API</Icon>
        <div>
          <strong>Forecast-model interface: future-ready, not active</strong>
          <span>
            The architecture can accept a future point-in-time forecasting
            model. Machine learning does not currently select or submit trades.
          </span>
        </div>
      </aside>
    </section>
  );
}

function ArchitectureSection() {
  return (
    <section className="content-section" id="architecture">
      <SectionHeading
        eyebrow="03 / Engineering architecture"
        title="Private evidence. Public proof."
        copy="A one-way publication boundary keeps operational state out of the portfolio experience."
      />
      <div className="architecture-flow" aria-label="System data flow">
        {architecture.map(([number, title, copy], index) => (
          <div className="architecture-step" key={number}>
            <article>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
            {index < architecture.length - 1 && <i aria-hidden="true">→</i>}
          </div>
        ))}
      </div>
      <div className="boundary-note">
        <span>PRIVATE OPERATIONAL BOUNDARY</span>
        <i />
        <span>PUBLIC READ-ONLY BOUNDARY</span>
      </div>
    </section>
  );
}

function SafetySection() {
  return (
    <section className="content-section" id="safety">
      <SectionHeading
        eyebrow="04 / Reliability + safety"
        title="Failure is a state, not a surprise."
        copy="Controls are designed to stop, preserve evidence, and make recovery reviewable."
      />
      <div className="safety-grid">
        {safeguards.map(([code, title, copy]) => (
          <article className="safety-card" key={code}>
            <Icon>{code}</Icon>
            <div>
              <h3>{title}</h3>
              <p>{copy}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer>
      <div>
        <a className="brand" href="#top">
          <span className="brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          QFL / RESEARCH
        </a>
        <p>
          Educational quantitative research—not investment advice. Historical
          and SHADOW results do not establish future profitability.
        </p>
      </div>
      <div>
        <span>Technology</span>
        <p>Python · React · TypeScript · SQLite · Alpaca IEX · Yahoo · XNYS</p>
      </div>
      <div>
        <span>Availability</span>
        <p>
          PAPER evaluation locked
          <br />
          Live trading unavailable
        </p>
      </div>
      <a
        className="repo-link"
        href="https://github.com/michaelbertoldo/QuantFinanceLearn"
        target="_blank"
        rel="noreferrer"
      >
        GitHub repository <span aria-hidden="true">↗</span>
      </a>
    </footer>
  );
}

export default function App({ loadSnapshot = loadPublicSnapshot }: AppProps) {
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const stableLoader = useMemo(() => loadSnapshot, [loadSnapshot]);

  useEffect(() => {
    let active = true;
    stableLoader().then(
      (result) => active && setState({ kind: "ready", result }),
      (error: unknown) => {
        if (!active) return;
        if (error instanceof SnapshotUnavailableError) {
          setState({ kind: "unavailable", message: error.message });
        } else {
          setState({
            kind: "error",
            message:
              error instanceof Error
                ? error.message
                : "The sanitized snapshot could not be validated.",
          });
        }
      },
    );
    return () => {
      active = false;
    };
  }, [stableLoader]);

  return (
    <div className="app-shell">
      <ShellHeader />
      <main id="main-content">
        <Hero />
        <section className="content-section evaluation-section" id="evaluation">
          <SectionHeading
            eyebrow="Live research status"
            title="Evidence over excitement."
            copy="Forward progress comes only from genuine, completed SHADOW sessions—not replay or backfill."
          />
          {state.kind === "ready" ? (
            <EvaluationPanel result={state.result} />
          ) : (
            <SnapshotState state={state} />
          )}
        </section>
        <HistoricalResearch />
        <StrategySection />
        <ArchitectureSection />
        <SafetySection />
      </main>
      <Footer />
    </div>
  );
}
