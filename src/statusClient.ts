import fixture from "./fixtures/public-status.fixture.json";
import {
  fixtureEnvelopeSchema,
  publicStatusSchema,
  type SnapshotResult,
} from "./statusSchema";

export class SnapshotUnavailableError extends Error {}

export class SnapshotValidationError extends Error {}

export async function loadPublicSnapshot(
  fetcher: typeof fetch = fetch,
): Promise<SnapshotResult> {
  if (import.meta.env.VITE_USE_STATUS_FIXTURE === "true") {
    const parsed = fixtureEnvelopeSchema.parse(fixture);
    return {
      snapshot: parsed.snapshot,
      isFixture: true,
      fixtureLabel: parsed.label,
    };
  }

  let response: Response;
  try {
    response = await fetcher("/data/quant-finance-status.json", {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
  } catch {
    throw new SnapshotUnavailableError(
      "The public snapshot endpoint is unavailable.",
    );
  }
  if (response.status === 404) {
    throw new SnapshotUnavailableError(
      "No sanitized public snapshot has been published yet.",
    );
  }
  if (!response.ok) {
    throw new SnapshotUnavailableError(
      "The public snapshot could not be retrieved.",
    );
  }
  try {
    return {
      snapshot: publicStatusSchema.parse(await response.json()),
      isFixture: false,
    };
  } catch {
    throw new SnapshotValidationError(
      "The published snapshot failed safety validation.",
    );
  }
}
