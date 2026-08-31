import { describe, expect, it } from "vitest";

import { sortDeliverablesByDefault } from "./sortDeliverables";

describe("sortDeliverablesByDefault", () => {
  it("sorts rows by configured status order and due date ascending within each status", () => {
    const sorted = sortDeliverablesByDefault([
      {
        id: "under-review",
        status: "Under CMS Review",
        dueDate: "2026-05-05",
      },
      {
        id: "submitted",
        status: "Submitted",
        dueDate: "2026-05-03",
      },
      {
        id: "approved",
        status: "Approved",
        dueDate: "2026-05-01",
      },
      {
        id: "upcoming-late",
        status: "Upcoming",
        dueDate: "2026-05-06",
      },
      {
        id: "past-due",
        status: "Past Due",
        dueDate: "2026-05-04",
      },
      {
        id: "upcoming-early",
        status: "Upcoming",
        dueDate: "2026-05-02",
      },
      {
        id: "accepted",
        status: "Accepted",
        dueDate: "2026-05-07",
      },
      {
        id: "received-filed",
        status: "Received and Filed",
        dueDate: "2026-05-08",
      },
    ]);

    expect(sorted.map((row) => row.id)).toEqual([
      "past-due",
      "upcoming-early",
      "upcoming-late",
      "submitted",
      "under-review",
      "approved",
      "accepted",
      "received-filed",
    ]);
  });

  it("uses id as deterministic tiebreaker when status and due date are equal", () => {
    const sorted = sortDeliverablesByDefault([
      {
        id: "b",
        status: "Upcoming",
        dueDate: "2026-05-01",
      },
      {
        id: "a",
        status: "Upcoming",
        dueDate: "2026-05-01",
      },
    ]);

    expect(sorted.map((row) => row.id)).toEqual(["a", "b"]);
  });

  it("prioritizes renewal-requested rows by due date before sorting remaining rows by status", () => {
    const sorted = sortDeliverablesByDefault([
      {
        id: "upcoming",
        status: "Upcoming",
        dueDate: "2026-05-01",
        renewalRequests: [],
      },
      {
        id: "requested-late",
        status: "Approved",
        dueDate: "2026-05-04",
        renewalRequests: [{ status: "Requested" }],
      },
      {
        id: "past-due",
        status: "Past Due",
        dueDate: "2026-05-03",
        renewalRequests: [],
      },
      {
        id: "requested-early",
        status: "Submitted",
        dueDate: "2026-05-02",
        renewalRequests: [{ status: "Requested" }],
      },
      {
        id: "submitted",
        status: "Submitted",
        dueDate: "2026-05-05",
        renewalRequests: [{ status: "Approved" }],
      },
    ]);

    expect(sorted.map((row) => row.id)).toEqual([
      "requested-early",
      "requested-late",
      "past-due",
      "upcoming",
      "submitted",
    ]);
  });
});
