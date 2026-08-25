import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  enqueueTrackedEmail: vi.fn(),
}));

vi.mock("../trackedEmail", () => ({
  enqueueTrackedEmail: mocks.enqueueTrackedEmail,
}));

vi.mock("../db", () => ({ getDbSchema: vi.fn(() => "demos_app") }));

import { deliverableDueTodayJob } from "./deliverableDueToday";

const baseRow = {
  deliverable_id: "11111111-1111-4111-8111-111111111111",
  deliverable_name: "Quarterly Report",
  deliverable_type_id: "Monitoring Report",
  deliverable_status_id: "Upcoming",
  demonstration_id: "22222222-2222-4222-8222-222222222222",
  demonstration_name: "Maryland Demonstration",
  state_id: "MD",
  owner_person_id: "33333333-3333-4333-8333-333333333333",
  owner_first_name: "CMS",
  owner_last_name: "Owner",
  owner_email: "Owner@Example.com",
  contact_person_id: "44444444-4444-4444-8444-444444444444",
  contact_first_name: "State",
  contact_last_name: "Contact",
  contact_email: "contact@example.com",
};

function context(rows: object[]) {
  return {
    scheduledAt: new Date("2026-08-24T12:00:00.000Z"),
    easternDate: "2026-08-24",
    pool: {
      query: vi.fn().mockResolvedValue({ rows }),
    },
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
  } as any;
}

describe("deliverableDueTodayJob", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.enqueueTrackedEmail.mockResolvedValue("queued");
  });

  it("queries only by Eastern due date and queues owner plus all contacts", async () => {
    const jobContext = context([
      baseRow,
      {
        ...baseRow,
        contact_person_id: baseRow.owner_person_id,
        contact_first_name: "CMS",
        contact_last_name: "Owner",
        contact_email: "owner@example.com",
      },
    ]);

    await expect(deliverableDueTodayJob.run(jobContext)).resolves.toEqual({
      processed: 1,
      succeeded: 1,
      failed: 0,
      skipped: 0,
    });

    const [sql, values] = jobContext.pool.query.mock.calls[0];
    expect(sql).toContain("d.due_date >=");
    expect(sql).toContain("d.due_date <");
    expect(sql).not.toMatch(/WHERE[^]*status_id\s*=/i);
    expect(sql).not.toContain("expected_to_be_submitted");
    expect(sql).not.toContain("due_date_type_id");
    expect(values).toEqual(["2026-08-24"]);

    expect(mocks.enqueueTrackedEmail).toHaveBeenCalledExactlyOnceWith(
      jobContext.pool,
      expect.objectContaining({
        emailType: "Deliverable Due Today",
        entityType: "deliverable",
        entityId: baseRow.deliverable_id,
        idempotencyKey:
          "Deliverable Due Today:deliverable:11111111-1111-4111-8111-111111111111:2026-08-24",
        jobId: "deliverable-due-today",
        recipients: [
          {
            personId: baseRow.owner_person_id,
            name: "CMS Owner",
            address: "Owner@Example.com",
          },
          {
            personId: baseRow.contact_person_id,
            name: "State Contact",
            address: "contact@example.com",
          },
        ],
        payload: expect.objectContaining({
          recipients: {
            to: [],
            bcc: [
              { name: "CMS Owner", address: "Owner@Example.com" },
              { name: "State Contact", address: "contact@example.com" },
            ],
          },
          deliverable: expect.objectContaining({ dueDate: "2026-08-24" }),
        }),
      })
    );
  });

  it("counts an existing idempotency key as skipped", async () => {
    mocks.enqueueTrackedEmail.mockResolvedValue("skipped");

    await expect(deliverableDueTodayJob.run(context([baseRow]))).resolves.toEqual({
      processed: 1,
      succeeded: 0,
      failed: 0,
      skipped: 1,
    });
  });

  it("logs a failed item and continues with the next deliverable", async () => {
    const secondRow = {
      ...baseRow,
      deliverable_id: "55555555-5555-4555-8555-555555555555",
      deliverable_name: "Second Report",
      contact_person_id: null,
      contact_first_name: null,
      contact_last_name: null,
      contact_email: null,
    };
    mocks.enqueueTrackedEmail
      .mockRejectedValueOnce(new Error("SQS unavailable"))
      .mockResolvedValueOnce("queued");
    const jobContext = context([baseRow, secondRow]);

    await expect(deliverableDueTodayJob.run(jobContext)).resolves.toEqual({
      processed: 2,
      succeeded: 1,
      failed: 1,
      skipped: 0,
    });
    expect(mocks.enqueueTrackedEmail).toHaveBeenCalledTimes(2);
    expect(jobContext.logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ deliverableId: baseRow.deliverable_id }),
      "Daily job item failed"
    );
  });

  it("reports a recipient with no email without stopping the job", async () => {
    const jobContext = context([{ ...baseRow, owner_email: " " }]);

    await expect(deliverableDueTodayJob.run(jobContext)).resolves.toEqual({
      processed: 1,
      succeeded: 0,
      failed: 1,
      skipped: 0,
    });
    expect(mocks.enqueueTrackedEmail).not.toHaveBeenCalled();
    expect(jobContext.logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.any(Error) }),
      "Daily job item failed"
    );
  });
});
