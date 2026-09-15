import { handler } from "./index";
import { getAgreementAttachment } from "./agreementAttachment";
import { updateEmailNotificationStatus } from "./emailNotificationStatus";
import nodemailer from "nodemailer";
import type { SQSEvent } from "aws-lambda";

vi.mock("./agreementAttachment", () => ({ getAgreementAttachment: vi.fn() }));
vi.mock("./emailNotificationStatus", () => ({
  updateEmailNotificationStatus: vi.fn(),
}));
vi.mock("nodemailer", () => ({ default: { createTransport: vi.fn() } }));
const sendMail = vi.fn();
const attachment = {
  filename: "Terms.pdf",
  content: Buffer.from("accepted terms"),
  contentType: "application/pdf",
};
const event = {
  Records: [
    {
      body: JSON.stringify({
        emailNotificationId: "notification-id",
        emailType: "Terms And Conditions Requested",
        entityType: "reference",
        entityId: "inactive-configuration-id",
        payload: {
          recipients: { to: ["registered@example.test"] },
          reference: { name: "Reference.pdf" },
          agreement: {
            id: "accepted-agreement-id",
            name: "Terms",
            s3Path: "stored-agreement-key",
          },
        },
      }),
    },
  ],
} as SQSEvent;

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("DISABLE_EMAIL_ALLOWLIST", "true");
  vi.mocked(nodemailer.createTransport).mockReturnValue({ sendMail } as never);
  sendMail.mockResolvedValue({ messageId: "smtp-id" });
  vi.mocked(getAgreementAttachment).mockResolvedValue(attachment);
});
afterEach(() => vi.unstubAllEnvs());

it("sends the snapshotted agreement and records Sent", async () => {
  await handler(event);
  expect(getAgreementAttachment).toHaveBeenCalledWith(
    expect.objectContaining({
      agreement: {
        id: "accepted-agreement-id",
        name: "Terms",
        s3Path: "stored-agreement-key",
      },
    })
  );
  expect(sendMail).toHaveBeenCalledWith(
    expect.objectContaining({
      to: ["registered@example.test"],
      attachments: [attachment],
      text: expect.stringContaining("Terms.pdf"),
    })
  );
  expect(updateEmailNotificationStatus).toHaveBeenCalledWith("notification-id", "Sent", null);
});

it("records attachment failure and never sends an incomplete email", async () => {
  vi.mocked(getAgreementAttachment).mockRejectedValue(new Error("NoSuchKey"));
  await expect(handler(event)).rejects.toThrow("NoSuchKey");
  expect(sendMail).not.toHaveBeenCalled();
  expect(updateEmailNotificationStatus).toHaveBeenCalledWith(
    "notification-id",
    "Failed",
    "NoSuchKey"
  );
});

it("records SMTP failure for retry", async () => {
  sendMail.mockRejectedValue(new Error("SMTP unavailable"));
  await expect(handler(event)).rejects.toThrow("SMTP unavailable");
  expect(updateEmailNotificationStatus).toHaveBeenCalledWith(
    "notification-id",
    "Failed",
    "SMTP unavailable"
  );
});
