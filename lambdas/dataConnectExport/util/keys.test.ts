import { describe, expect, it } from "vitest";

import { partitionKey, successKey } from "./keys";

describe("partitionKey", () => {
  it("builds the Hive partition key the dashboard reads", () => {
    expect(partitionKey("demonstration", new Date("2026-09-04T07:00:00Z"))).toBe(
      "demonstration/dt=2026-09-04/part-000.parquet"
    );
  });

  it("puts the relation first so one prefix per relation can be scanned", () => {
    expect(partitionKey("state", new Date("2026-09-04T07:00:00Z"))).toBe(
      "state/dt=2026-09-04/part-000.parquet"
    );
  });

  it("never produces a leading slash, which S3 would treat as an empty first segment", () => {
    expect(partitionKey("state", new Date("2026-09-04T07:00:00Z")).startsWith("/")).toBe(false);
  });
});

describe("successKey", () => {
  it("builds the run-level marker key", () => {
    expect(successKey(new Date("2026-09-04T07:00:00Z"))).toBe("_run/dt=2026-09-04/_SUCCESS");
  });

  it("keeps both the prefix and the filename underscore-led", () => {
    // Athena, Spark and Glue all skip path segments beginning with _ or . This is the
    // only reason the marker can sit alongside data without being read as data.
    const [prefix, , file] = successKey(new Date("2026-09-04T07:00:00Z")).split("/");
    expect(prefix.startsWith("_")).toBe(true);
    expect(file.startsWith("_")).toBe(true);
  });
});

describe("the date both keys embed", () => {
  // The handler passes one Date to both functions. If they ever disagree the marker
  // lands in a different partition from the data it certifies.
  it("agrees between the two functions for the same instant", () => {
    const runDate = new Date("2026-09-04T07:00:00Z");
    const partitionDt = partitionKey("demonstration", runDate).split("/")[1];
    const markerDt = successKey(runDate).split("/")[1];
    expect(partitionDt).toBe(markerDt);
    expect(partitionDt).toBe("dt=2026-09-04");
  });

  it("is the UTC day, not the local one", () => {
    // These two instants fall on different local days in most of the world, and on
    // different UTC days from each other. Anything built from local getters drifts here.
    expect(partitionKey("r", new Date("2026-09-04T23:59:59.999Z"))).toContain("dt=2026-09-04");
    expect(partitionKey("r", new Date("2026-09-05T00:00:00.000Z"))).toContain("dt=2026-09-05");
  });

  it("zero-pads month and day so keys sort lexically", () => {
    expect(partitionKey("r", new Date("2026-01-02T07:00:00Z"))).toContain("dt=2026-01-02");
  });
});
