import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import App from "./App";
import {
  SnapshotUnavailableError,
  SnapshotValidationError,
} from "./statusClient";
import { healthySnapshot, result } from "./test/fixtures";

afterEach(cleanup);

describe("public dashboard states", () => {
  it("renders the loading state", () => {
    render(<App loadSnapshot={() => new Promise(() => undefined)} />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading sanitized evidence",
    );
  });

  it("renders a healthy sanitized snapshot", async () => {
    render(<App loadSnapshot={() => Promise.resolve(result())} />);
    expect(await screen.findByText("Current evaluation")).toBeInTheDocument();
    expect(screen.getByText("HEALTHY")).toBeInTheDocument();
    expect(screen.getByText("2026-09-14")).toBeInTheDocument();
    expect(screen.getByText("$510.00")).toBeInTheDocument();
    expect(screen.queryByText(/demonstration data/i)).not.toBeInTheDocument();
  });

  it("renders a stale-data warning", async () => {
    const snapshot = healthySnapshot({
      generated_at: "2026-01-01T00:00:00Z",
      freshness: {
        state: "stale",
        age_seconds: 400000,
        stale_after_seconds: 345600,
      },
    });
    render(<App loadSnapshot={() => Promise.resolve(result(snapshot))} />);
    expect(
      await screen.findByText("Public snapshot is stale"),
    ).toBeInTheDocument();
  });

  it("renders the unavailable state without a private fallback", async () => {
    render(
      <App
        loadSnapshot={() =>
          Promise.reject(
            new SnapshotUnavailableError(
              "No public snapshot has been published.",
            ),
          )
        }
      />,
    );
    expect(
      await screen.findByText("Forward status unavailable"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/No private fallback is attempted/i),
    ).toBeInTheDocument();
  });

  it("renders a safe error state for invalid input", async () => {
    render(
      <App
        loadSnapshot={() =>
          Promise.reject(
            new SnapshotValidationError(
              "The snapshot failed safety validation.",
            ),
          )
        }
      />,
    );
    expect(
      await screen.findByText("Snapshot validation failed"),
    ).toBeInTheDocument();
  });

  it("visibly labels fixture data", async () => {
    render(
      <App
        loadSnapshot={() =>
          Promise.resolve({
            snapshot: healthySnapshot(),
            isFixture: true,
            fixtureLabel: "DEMONSTRATION DATA — NOT GENUINE FORWARD EVIDENCE",
          })
        }
      />,
    );
    expect(
      await screen.findByText(
        "DEMONSTRATION DATA — NOT GENUINE FORWARD EVIDENCE",
      ),
    ).toBeVisible();
  });

  it("caps visual session progress at the required count", async () => {
    const snapshot = healthySnapshot({
      evaluation: {
        qualifying_sessions: { completed: 87, required: 60 },
        month_end_cycles: { completed: 4, required: 2 },
        latest_successful_session: "2026-09-14",
      },
    });
    const { container } = render(
      <App loadSnapshot={() => Promise.resolve(result(snapshot))} />,
    );
    await screen.findByText("Current evaluation");
    const progress = container.querySelector(
      "progress[max='60']",
    ) as HTMLProgressElement;
    expect(progress.value).toBe(60);
    expect(
      screen.getByRole("img", {
        name: /Qualifying sessions: 60 of 60, 100% complete/,
      }),
    ).toBeInTheDocument();
  });

  it("never displays progress above 60 sessions or 2 month-end cycles", async () => {
    const snapshot = healthySnapshot({
      evaluation: {
        qualifying_sessions: { completed: 87, required: 60 },
        month_end_cycles: { completed: 4, required: 2 },
        latest_successful_session: "2026-09-14",
      },
    });
    render(<App loadSnapshot={() => Promise.resolve(result(snapshot))} />);

    expect(
      await screen.findByRole("img", {
        name: "Qualifying sessions: 60 of 60, 100% complete",
      }),
    ).toHaveTextContent("60/ 60");
    expect(
      screen.getByRole("img", {
        name: "Month-end cycles: 2 of 2, 100% complete",
      }),
    ).toHaveTextContent("2/ 2");
    expect(screen.queryByText("87")).not.toBeInTheDocument();
    expect(screen.queryByText("4")).not.toBeInTheDocument();
  });

  it("does not stay in loading after a successful response", async () => {
    render(<App loadSnapshot={() => Promise.resolve(result())} />);
    await waitFor(() =>
      expect(screen.queryByRole("status")).not.toBeInTheDocument(),
    );
  });
});
