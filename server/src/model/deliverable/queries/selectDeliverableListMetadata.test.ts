import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../../prismaClient";
import { selectDeliverableListMetadata } from "./selectDeliverableListMetadata";

vi.mock("../../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("selectDeliverableListMetadata", () => {
  const deliverableActionGroupBy = vi.fn();
  const deliverableExtensionGroupBy = vi.fn();
  const documentGroupBy = vi.fn();
  const publicCommentGroupBy = vi.fn();
  const privateCommentGroupBy = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue({
      deliverableAction: { groupBy: deliverableActionGroupBy },
      deliverableExtension: { groupBy: deliverableExtensionGroupBy },
      document: { groupBy: documentGroupBy },
      publicComment: { groupBy: publicCommentGroupBy },
      privateComment: { groupBy: privateCommentGroupBy },
    } as never);
    deliverableActionGroupBy.mockResolvedValue([]);
    deliverableExtensionGroupBy.mockResolvedValue([]);
    documentGroupBy.mockResolvedValue([]);
    publicCommentGroupBy.mockResolvedValue([]);
    privateCommentGroupBy.mockResolvedValue([]);
  });

  it("aggregates list metadata for all requested deliverables", async () => {
    const submittedAt = new Date("2026-07-01T12:00:00Z");
    deliverableActionGroupBy.mockResolvedValue([
      {
        deliverableId: "d1",
        actionTypeId: "Requested Resubmission",
        _count: { _all: 3 },
        _max: { actionTimestamp: null },
      },
      {
        deliverableId: "d1",
        actionTypeId: "Submitted Deliverable",
        _count: { _all: 2 },
        _max: { actionTimestamp: submittedAt },
      },
    ]);
    deliverableExtensionGroupBy.mockResolvedValue([{ deliverableId: "d1" }]);
    documentGroupBy.mockResolvedValue([{ deliverableId: "d1" }]);

    const result = await selectDeliverableListMetadata(["d1", "d2"]);

    expect(result).toEqual([
      {
        id: "d1",
        resubmissionCount: 3,
        hasOpenExtensionRequest: true,
        latestSubmissionDate: submittedAt,
        hasFilesOrComments: true,
      },
      {
        id: "d2",
        resubmissionCount: 0,
        hasOpenExtensionRequest: false,
        latestSubmissionDate: null,
        hasFilesOrComments: false,
      },
    ]);
  });

  it("uses grouped and existence-only queries", async () => {
    await selectDeliverableListMetadata(["d1", "d2"]);

    expect(deliverableActionGroupBy).toHaveBeenCalledExactlyOnceWith({
      by: ["deliverableId", "actionTypeId"],
      where: {
        deliverableId: { in: ["d1", "d2"] },
        actionTypeId: { in: ["Requested Resubmission", "Submitted Deliverable"] },
      },
      _count: { _all: true },
      _max: { actionTimestamp: true },
    });
    expect(documentGroupBy).toHaveBeenCalledExactlyOnceWith({
      by: ["deliverableId"],
      where: { deliverableId: { in: ["d1", "d2"] } },
    });
  });
});
