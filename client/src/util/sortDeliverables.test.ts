import { describe, expect, it } from "vitest";

import { sortDeliverablesByDefault } from "./sortDeliverables";

describe("sortDeliverablesByDefault", () => {
  it("sorts rows by status and then due date", () => {
    const sorted = sortDeliverablesByDefault([
      {
        id: "under-review",
        status: "Under CMS Review",
        dueDate: "2026-05-05",
      },
      {
        id: "ext-late",
        status: "Received and Filed",
        dueDate: "2026-05-10",
      },
      {
        id: "submitted",
        status: "Submitted",
        dueDate: "2026-05-03",
      },
      {
        id: "ext-early",
        status: "Approved",
        dueDate: "2026-05-01",
      },
      {
        id: "upcoming",
        status: "Upcoming",
        dueDate: "2026-05-02",
      },
      {
        id: "past-due",
        status: "Past Due",
        dueDate: "2026-05-04",
      },
    ]);

    expect(sorted.map((row) => row.id)).toEqual([
      "past-due",
      "upcoming",
      "submitted",
      "under-review",
      "ext-early",
      "ext-late",
    ]);
  });
});
