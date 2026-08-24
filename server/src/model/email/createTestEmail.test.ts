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
    await expect(createTestEmail(" user@cms.hhs.gov ")).resolves.toBe("message-1");

    expect(enqueueEmail).toHaveBeenCalledExactlyOnceWith({
      to: "user@cms.hhs.gov",
      subject: "CMS DEMOS: Test Email",
      text: "This is a test email confirming that the DEMOS email and SQS system is working.\n\nThank you,\nDEMOS Notifications",
    });
  });

  it.each(["icf.com", "globalalliantinc.com", "t1cg.com", "CMS.HHS.GOV"])(
    "allows the %s email domain",
    async (domain) => {
      await expect(createTestEmail(`user@${domain}`)).resolves.toBe("message-1");
      expect(enqueueEmail).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ to: `user@${domain}` })
      );
    }
  );

  it.each(["", "   ", "not-an-email", "user@"])(
    "rejects invalid recipient email %j before queueing",
    async (recipientEmail) => {
      await expect(createTestEmail(recipientEmail)).rejects.toThrow(
        "A valid recipient email address is required to send a test email."
      );
      expect(enqueueEmail).not.toHaveBeenCalled();
    }
  );

  it.each(["user@example.com", "user@mail.cms.hhs.gov"])(
    "rejects unapproved recipient email %j before queueing",
    async (recipientEmail) => {
      await expect(createTestEmail(recipientEmail)).rejects.toThrow(
        "A valid recipient email address is required to send a test email."
      );
      expect(enqueueEmail).not.toHaveBeenCalled();
    }
  );
});
