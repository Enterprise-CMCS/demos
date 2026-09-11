import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
}));

vi.mock("./db", () => ({
  getDbPool: vi.fn(async () => ({ query: mocks.query })),
  getDbSchema: vi.fn(() => "demos_app"),
}));

import { updateEmailNotificationStatus } from "./emailNotificationStatus";

describe("updateEmailNotificationStatus", () => {
  beforeEach(() => {
    mocks.query.mockReset();
    mocks.query.mockResolvedValue({ rowCount: 1 });
  });

  it("records successful delivery", async () => {
    await updateEmailNotificationStatus(
      "01c20d4d-c918-4c8e-89be-6b73178a66f2",
      "Sent"
    );

    expect(mocks.query).toHaveBeenCalledExactlyOnceWith(
      expect.stringContaining("WHERE id = $1::UUID AND status_id = 'Queued'"),
      ["01c20d4d-c918-4c8e-89be-6b73178a66f2", "Sent", null]
    );
  });

  it("records delivery failure details", async () => {
    await updateEmailNotificationStatus(
      "01c20d4d-c918-4c8e-89be-6b73178a66f2",
      "Failed",
      "SMTP unavailable"
    );

    expect(mocks.query).toHaveBeenCalledWith(expect.any(String), [
      "01c20d4d-c918-4c8e-89be-6b73178a66f2",
      "Failed",
      "SMTP unavailable",
    ]);
  });

  it("reports a notification that is not queued", async () => {
    mocks.query.mockResolvedValue({ rowCount: 0 });

    await expect(
      updateEmailNotificationStatus(
        "01c20d4d-c918-4c8e-89be-6b73178a66f2",
        "Sent"
      )
    ).rejects.toThrow(
      "Email notification is not queued: 01c20d4d-c918-4c8e-89be-6b73178a66f2"
    );
  });
});
