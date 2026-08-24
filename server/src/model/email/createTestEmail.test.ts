import { beforeEach, describe, expect, it, vi } from "vitest";
import { enqueueEmail } from "../../services/emailQueue";
import { createTestEmail } from "./createTestEmail";

vi.mock("../../services/emailQueue", () => ({
  enqueueEmail: vi.fn(),
}));

describe("createTestEmail", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(enqueueEmail).mockResolvedValue("message-1");
  });

  it("enqueues the fixed test email and returns its message ID", async () => {
    await expect(createTestEmail(" user@example.com ")).resolves.toBe("message-1");

    expect(enqueueEmail).toHaveBeenCalledExactlyOnceWith({
      to: "user@example.com",
      subject: "CMS DEMOS: Test Email",
      text: "This is a test email confirming that the DEMOS email and SQS system is working.\n\nThank you,\nDEMOS Notifications",
    });
  });

  it.each(["", "   ", "not-an-email", "user@"])(
    "rejects invalid recipient email %j before queueing",
    async (recipientEmail) => {
      await expect(createTestEmail(recipientEmail)).rejects.toThrow(
        "A valid recipient email address is required to send a test email."
      );
      expect(enqueueEmail).not.toHaveBeenCalled();
    }
  );
});
