import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GraphQLContext } from "../../auth";
import type { CreateDeliverableInput } from "../../types";
import { dispatchMultipleDeliverablesCreatedEmail } from "../email";
import { createDeliverable } from "./createDeliverable";
import { createDeliverables } from "./createDeliverables";

vi.mock("./createDeliverable", () => ({
  createDeliverable: vi.fn()
}));

vi.mock("../email", () => ({
  dispatchMultipleDeliverablesCreatedEmail: vi.fn()
}));

describe("createDeliverables", () => {
  const context = { user: { id: "user-1" } } as GraphQLContext;
  const input = {
    name: "Quarterly Report",
    deliverableType: "Close Out Report",
    demonstrationId: "demonstration-1",
    cmsOwnerUserId: "owner-1",
    dueDate: "2026-08-01"
  } as CreateDeliverableInput;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("rejects an empty batch", async () => {
    await expect(createDeliverables([], context)).rejects.toThrow(
      "Cannot create deliverables without at least one input."
    );
  });

  it("uses the existing single-deliverable notification", async () => {
    vi.mocked(createDeliverable).mockResolvedValue({
      id: "deliverable-1"
    } as never);

    await expect(createDeliverables([input], context)).resolves.toEqual([{ id: "deliverable-1" }]);

    expect(createDeliverable).toHaveBeenCalledExactlyOnceWith(input, context);
    expect(dispatchMultipleDeliverablesCreatedEmail).not.toHaveBeenCalled();
  });

  it("creates a batch without individual emails and dispatches one grouped email", async () => {
    vi.mocked(createDeliverable)
      .mockResolvedValueOnce({ id: "deliverable-1" } as never)
      .mockResolvedValueOnce({ id: "deliverable-2" } as never);

    await createDeliverables([input, { ...input, name: "Quarterly Report 2" }], context);

    expect(createDeliverable).toHaveBeenNthCalledWith(1, input, context, {
      sendEmailNotifications: false
    });
    expect(createDeliverable).toHaveBeenNthCalledWith(2, { ...input, name: "Quarterly Report 2" }, context, {
      sendEmailNotifications: false
    });
    expect(dispatchMultipleDeliverablesCreatedEmail).toHaveBeenCalledExactlyOnceWith({
      deliverableIds: ["deliverable-1", "deliverable-2"],
      triggeredByUserId: "user-1"
    });
  });

  it("rejects a mixed batch before creating deliverables", async () => {
    await expect(
      createDeliverables([input, { ...input, deliverableType: "Monitoring Report" }], context)
    ).rejects.toThrow("Multiple deliverables must have the same demonstration, deliverable type, and CMS owner.");

    expect(createDeliverable).not.toHaveBeenCalled();
  });
});
