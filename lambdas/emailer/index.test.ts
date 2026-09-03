import {
  handler,
  clearCache,
  getAllowList,
  isEmailerAddress,
  isValidEmailData,
  sendEmailIsAllowed,
  renderRealTimeEmails,
  redactEmailAddresses,
} from ".";
import { log } from "./log";
import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm";
import { mockClient } from "aws-sdk-client-mock";
import { SQSEvent } from "aws-lambda";
import nodemailer, { SentMessageInfo } from "nodemailer";
import Mail, { Options } from "nodemailer/lib/mailer";

const statusMocks = vi.hoisted(() => ({
  update: vi.fn(),
}));

vi.mock("./emailNotificationStatus", () => ({
  updateEmailNotificationStatus: statusMocks.update,
}));

const originalEnv = { ...process.env };

const mockEmailData = {
  to: "test@example.com",
  subject: "unit test subject",
  text: "unit test text",
};

const realtimeDeliverableCreatedEnvelope = {
  emailNotificationId: "01c20d4d-c918-4c8e-89be-6b73178a66f2",
  emailType: "Deliverable Created",
  entityType: "deliverable",
  entityId: "deliverable-1",
  triggeredBy: {
    type: "realtime",
    id: "user-1",
  },
  payload: {
    recipients: {
      to: ["not-allowed@email.com"],
    },
    demonstration: {
      id: "demonstration-1",
      name: "Medicaid Demonstration",
      stateId: "MD",
    },
    deliverable: {
      id: "deliverable-1",
      name: "Quarterly Budget Report",
      deliverableTypeId: "Close Out Report",
      dueDate: "2026-06-01T12:00:00.000Z",
      extensionDecision: "Approved",
      previousDueDate: "2026-05-01T12:00:00.000Z",
      requestedDueDate: "2026-07-01T12:00:00.000Z",
      statusId: "Upcoming",
    },
  },
};

function sqsEvent(body: string): SQSEvent {
  return {
    Records: [
      {
        messageId: "19dd0b57-b21e-4ac1-bd88-01bbb068cb78",
        receiptHandle: "MessageReceiptHandle",
        body,
        attributes: {
          ApproximateReceiveCount: "1",
          SentTimestamp: "1523232000000",
          SenderId: "123456789012",
          ApproximateFirstReceiveTimestamp: "1523232000001",
        },
        messageAttributes: {},
        md5OfBody: "{{{md5_of_body}}}",
        eventSource: "aws:sqs",
        eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:MyQueue",
        awsRegion: "us-east-1",
      },
    ],
  };
}

const ssmMock = mockClient(SSMClient);
vi.mock("nodemailer");

describe("emailer", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    ssmMock.reset();
    clearCache();
    vi.clearAllMocks();
    statusMocks.update.mockResolvedValue(undefined);
  });

  it("should pass only supported direct email fields to nodemailer", async () => {
    process.env.EMAIL_FROM = "sender@email.com";
    const emailData = JSON.stringify({
      to: "test@email.com",
      subject: "Unit Test",
      text: "this is the text body",
      from: "untrusted@email.com",
      attachments: [{ filename: "untrusted.txt", content: "untrusted" }],
    });
    const mockEvent: SQSEvent = {
      Records: [
        {
          messageId: "19dd0b57-b21e-4ac1-bd88-01bbb068cb78",
          receiptHandle: "MessageReceiptHandle",
          body: emailData,
          attributes: {
            ApproximateReceiveCount: "1",
            SentTimestamp: "1523232000000",
            SenderId: "123456789012",
            ApproximateFirstReceiveTimestamp: "1523232000001",
          },
          messageAttributes: {},
          md5OfBody: "{{{md5_of_body}}}",
          eventSource: "aws:sqs",
          eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:MyQueue",
          awsRegion: "us-east-1",
        },
      ],
    };

    ssmMock.on(GetParameterCommand).resolves({
      Parameter: {
        Value: '["email@example.com","test@email.com","unit@test.com"]',
      },
    });
    const sendMailSpy = vi.fn(() => ({ messageId: "unit-test" }));
    vi.spyOn(nodemailer, "createTransport").mockImplementation(
      () => ({ sendMail: sendMailSpy }) as unknown as Mail<SentMessageInfo, Options>
    );

    const out = await handler(mockEvent);
    expect(out).toEqual("success");
    expect(sendMailSpy).toHaveBeenCalledOnce();
    expect(sendMailSpy).toHaveBeenCalledWith({
      to: "test@email.com",
      subject: "Unit Test",
      text: "this is the text body",
      from: "sender@email.com",
    });
  });

  it("should properly handle a valid sqs event with email not in allowlist", async () => {
    const emailData =
      '{"to":"not-allowed@email.com","subject":"Unit Test","text":"this is the text body"}';
    const mockEvent: SQSEvent = {
      Records: [
        {
          messageId: "19dd0b57-b21e-4ac1-bd88-01bbb068cb78",
          receiptHandle: "MessageReceiptHandle",
          body: emailData,
          attributes: {
            ApproximateReceiveCount: "1",
            SentTimestamp: "1523232000000",
            SenderId: "123456789012",
            ApproximateFirstReceiveTimestamp: "1523232000001",
          },
          messageAttributes: {},
          md5OfBody: "{{{md5_of_body}}}",
          eventSource: "aws:sqs",
          eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:MyQueue",
          awsRegion: "us-east-1",
        },
      ],
    };

    ssmMock.on(GetParameterCommand).resolves({
      Parameter: {
        Value: '["email@example.com","test@email.com","unit@test.com"]',
      },
    });
    const sendMailSpy = vi.fn(() => ({ messageId: "unit-test" }));
    vi.spyOn(nodemailer, "createTransport").mockImplementation(
      () => ({ sendMail: sendMailSpy }) as unknown as Mail<SentMessageInfo, Options>
    );
    const infoSpy = vi.spyOn(log, "info");

    const out = await handler(mockEvent);
    expect(out).toEqual("success");
    expect(sendMailSpy).not.toHaveBeenCalled();
    expect(infoSpy).toHaveBeenCalledWith(expect.any(Object), "log only: email not in allowlist");
  });

  it("should render a realtime Deliverable Created envelope before allowlist processing", async () => {
    ssmMock.on(GetParameterCommand).resolves({
      Parameter: {
        Value: "[]",
      },
    });
    const sendMailSpy = vi.fn(() => ({ messageId: "unit-test" }));
    vi.spyOn(nodemailer, "createTransport").mockImplementation(
      () => ({ sendMail: sendMailSpy }) as unknown as Mail<SentMessageInfo, Options>
    );
    const infoSpy = vi.spyOn(log, "info");

    const out = await handler(sqsEvent(JSON.stringify(realtimeDeliverableCreatedEnvelope)));

    expect(out).toEqual("success");
    expect(sendMailSpy).not.toHaveBeenCalled();
    expect(infoSpy).toHaveBeenCalledWith(
      {
        emailType: "Deliverable Created",
        entityId: "deliverable-1",
      },
      "rendering realtime email template"
    );
    expect(infoSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        emailType: "Deliverable Created",
        entityType: "deliverable",
        entityId: "deliverable-1",
        triggeredBy: {
          type: "realtime",
          id: "user-1",
        },
        subject: "CMS DEMOS Deliverable: Deliverable Created",
        recipients: expect.objectContaining({
          to: ["no****@email.com"],
        }),
      }),
      "log only: email not in allowlist"
    );
    expect(statusMocks.update).toHaveBeenCalledWith(
      realtimeDeliverableCreatedEnvelope.emailNotificationId,
      "Failed",
      "Email blocked by recipient allowlist."
    );
  });

  it("should mark a tracked realtime email sent after SMTP succeeds", async () => {
    process.env.DISABLE_EMAIL_ALLOWLIST = "true";
    const sendMailSpy = vi.fn(() => ({ messageId: "unit-test" }));
    vi.spyOn(nodemailer, "createTransport").mockImplementation(
      () => ({ sendMail: sendMailSpy }) as unknown as Mail<SentMessageInfo, Options>
    );

    await expect(
      handler(sqsEvent(JSON.stringify(realtimeDeliverableCreatedEnvelope)))
    ).resolves.toBe("success");

    expect(statusMocks.update).toHaveBeenCalledExactlyOnceWith(
      realtimeDeliverableCreatedEnvelope.emailNotificationId,
      "Sent",
      null
    );
  });

  it("should mark a tracked realtime email failed when SMTP rejects it", async () => {
    process.env.DISABLE_EMAIL_ALLOWLIST = "true";
    vi.spyOn(nodemailer, "createTransport").mockImplementation(
      () =>
        ({ sendMail: vi.fn().mockRejectedValue(new Error("SMTP unavailable")) }) as unknown as Mail<
          SentMessageInfo,
          Options
        >
    );

    await expect(
      handler(sqsEvent(JSON.stringify(realtimeDeliverableCreatedEnvelope)))
    ).rejects.toThrow("SMTP unavailable");

    expect(statusMocks.update).toHaveBeenCalledExactlyOnceWith(
      realtimeDeliverableCreatedEnvelope.emailNotificationId,
      "Failed",
      "SMTP unavailable"
    );
  });

  it("should not resend an email when recording Sent fails", async () => {
    process.env.DISABLE_EMAIL_ALLOWLIST = "true";
    const errorSpy = vi.spyOn(log, "error");
    statusMocks.update.mockRejectedValueOnce(new Error("database unavailable"));
    const sendMailSpy = vi.fn(() => ({ messageId: "unit-test" }));
    vi.spyOn(nodemailer, "createTransport").mockImplementation(
      () => ({ sendMail: sendMailSpy }) as unknown as Mail<SentMessageInfo, Options>
    );

    await expect(
      handler(sqsEvent(JSON.stringify(realtimeDeliverableCreatedEnvelope)))
    ).resolves.toBe("success");
    expect(sendMailSpy).toHaveBeenCalledOnce();
    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ error: "database unavailable", status: "Sent" }),
      "unable to update email notification delivery status"
    );
  });

  it("should select Deliverable Submitted by email type", async () => {
    const email = await renderRealTimeEmails({
      ...realtimeDeliverableCreatedEnvelope,
      emailType: "Deliverable Submitted",
    });

    expect(email).toEqual(
      expect.objectContaining({
        subject: "CMS DEMOS Deliverable: Deliverable Submitted",
        text: expect.stringContaining("has been submitted for your Demonstration"),
      })
    );
  });

  it.each([
    ["Deliverable Due Date Updated", "CMS DEMOS Deliverable: Deliverable Due Date Updated"],
    ["Deliverable Accepted", "CMS DEMOS Deliverable: Accepted"],
    ["Deliverable Approved", "CMS DEMOS Deliverable: Approved"],
    ["Deliverable Received and Filed", "CMS DEMOS Deliverable: Received and Filed"],
    ["Extension Requested", "CMS DEMOS Deliverable: Extension Requested"],
    ["Extension Decision Made", "CMS DEMOS Deliverable: Extension Decision Made"],
    ["Resubmission Requested", "CMS DEMOS Deliverable: Resubmission Requested"],
    ["Public Comment Added", "CMS DEMOS Deliverable: Public Comment Added"],
  ])("should select the %s template by email type", async (emailType, subject) => {
    const email = await renderRealTimeEmails({
      ...realtimeDeliverableCreatedEnvelope,
      emailType,
    });

    expect(email).toEqual(expect.objectContaining({ subject }));
  });

  it("should report unsupported realtime email types", async () => {
    await expect(
      handler(
        sqsEvent(
          JSON.stringify({ ...realtimeDeliverableCreatedEnvelope, emailType: "Unknown Email" })
        )
      )
    ).rejects.toThrow("Unsupported email type: Unknown Email");
  });

  it("should report missing realtime email template payload values", async () => {
    await expect(
      handler(
        sqsEvent(
          JSON.stringify({
            ...realtimeDeliverableCreatedEnvelope,
            payload: {
              ...realtimeDeliverableCreatedEnvelope.payload,
              deliverable: {
                ...realtimeDeliverableCreatedEnvelope.payload.deliverable,
                name: "",
              },
            },
          })
        )
      )
    ).rejects.toThrow(
      "Missing value for deliverable.name while rendering Deliverable Created.data"
    );
    expect(statusMocks.update).toHaveBeenCalledWith(
      realtimeDeliverableCreatedEnvelope.emailNotificationId,
      "Failed",
      "Missing value for deliverable.name while rendering Deliverable Created.data"
    );
  });

  it("should cancel processing if event body is invalid", async () => {
    const mockEvent: SQSEvent = {
      Records: [
        {
          messageId: "19dd0b57-b21e-4ac1-bd88-01bbb068cb78",
          receiptHandle: "MessageReceiptHandle",
          body: "{invalid: json}",
          attributes: {
            ApproximateReceiveCount: "1",
            SentTimestamp: "1523232000000",
            SenderId: "123456789012",
            ApproximateFirstReceiveTimestamp: "1523232000001",
          },
          messageAttributes: {},
          md5OfBody: "{{{md5_of_body}}}",
          eventSource: "aws:sqs",
          eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:MyQueue",
          awsRegion: "us-east-1",
        },
      ],
    };
    const infoSpy = vi.spyOn(log, "info");

    const out = await handler(mockEvent);
    expect(out).toBeUndefined();
    expect(infoSpy).toHaveBeenCalledWith(expect.any(Object), "unable to parse SQS message body");
  });

  it("should cancel processing if email data is invalid", async () => {
    const mockEvent: SQSEvent = {
      Records: [
        {
          messageId: "19dd0b57-b21e-4ac1-bd88-01bbb068cb78",
          receiptHandle: "MessageReceiptHandle",
          body: '{"to": "test@email.com"}',
          attributes: {
            ApproximateReceiveCount: "1",
            SentTimestamp: "1523232000000",
            SenderId: "123456789012",
            ApproximateFirstReceiveTimestamp: "1523232000001",
          },
          messageAttributes: {},
          md5OfBody: "{{{md5_of_body}}}",
          eventSource: "aws:sqs",
          eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:MyQueue",
          awsRegion: "us-east-1",
        },
      ],
    };
    const infoSpy = vi.spyOn(log, "info");

    const out = await handler(mockEvent);
    expect(out).toBeUndefined();
    expect(infoSpy).toHaveBeenCalledWith("an email must have a 'subject' property");
  });

  it("should return undefined if event has no records", async () => {
    const mockEvent: SQSEvent = {
      Records: [],
    };

    const out = await handler(mockEvent);
    expect(out).toBeUndefined();
  });

  it("should verify the required fields exist", () => {
    const infoSpy = vitest.spyOn(log, "info");
    expect(isValidEmailData(mockEmailData)).toEqual(true);
    expect(isValidEmailData({ ...mockEmailData, to: undefined })).toEqual(false);
    expect(infoSpy).toHaveBeenLastCalledWith(expect.stringContaining("'to' property"));
    expect(isValidEmailData({ ...mockEmailData, subject: undefined })).toEqual(false);
    expect(infoSpy).toHaveBeenLastCalledWith(expect.stringContaining("'subject' property"));
    expect(isValidEmailData({ ...mockEmailData, text: undefined })).toEqual(false);
    expect(infoSpy).toHaveBeenLastCalledWith(expect.stringContaining("'text' property"));
  });
  it("should validate that the address is one of the valid formats", () => {
    expect(isEmailerAddress("test@email.com")).toEqual(true);
    expect(isEmailerAddress({ name: "Unit Test", address: "test@email.com" })).toEqual(true);
    expect(
      isEmailerAddress([{ name: "Unit Test", address: "test@email.com" }, "test@email.com"])
    ).toEqual(true);

    expect(isEmailerAddress()).toEqual(false);
    // @ts-expect-error
    expect(isEmailerAddress(1)).toEqual(false);
    // @ts-expect-error
    expect(isEmailerAddress({ name: "Unit Test" })).toEqual(false);
    // @ts-expect-error
    expect(isEmailerAddress([{ name: "Unit Test", address: "test@email.com" }, 1])).toEqual(false);
  });
  it("should be allowed to send to approved emails", async () => {
    ssmMock.on(GetParameterCommand).resolves({
      Parameter: {
        Value: '["email@example.com","test@email.com","unit@test.com"]',
      },
    });
    expect(await sendEmailIsAllowed("test@email.com")).toEqual(true);
    expect(await sendEmailIsAllowed({ name: "Unit Test", address: "email@example.com" })).toEqual(
      true
    );
    expect(
      await sendEmailIsAllowed([
        { name: "Unit Test", address: "email@example.com" },
        "test@email.com",
      ])
    ).toEqual(true);
    expect(await sendEmailIsAllowed("test@email.com", undefined, "unit@test.com")).toEqual(true);
  });
  it("should return false when an invalid address is included", async () => {
    ssmMock.on(GetParameterCommand).resolves({
      Parameter: {
        Value: '["email@example.com","test@email.com","unit@test.com"]',
      },
    });
    expect(await sendEmailIsAllowed("bad@email.com")).toEqual(false);
    expect(await sendEmailIsAllowed({ name: "Unit Test", address: "bad@example.com" })).toEqual(
      false
    );
    expect(
      await sendEmailIsAllowed([
        { name: "Unit Test", address: "bad@example.com" },
        "test@email.com",
      ])
    ).toEqual(false);
    expect(await sendEmailIsAllowed("test@email.com", undefined, "bad@email.com")).toEqual(false);
  });

  it("should successfully return a list of allowList email addresses", async () => {
    ssmMock.on(GetParameterCommand).resolves({
      Parameter: {
        Value: '["email@example.com","test@email.com","unit@test.com"]',
      },
    });
    const list = await getAllowList();
    expect(list).toEqual(["email@example.com", "test@email.com", "unit@test.com"]);
    expect(ssmMock.calls()).toHaveLength(1);

    // second call should use the cached value, so calls length should still be 1
    const list2 = await getAllowList();
    expect(list2).toEqual(["email@example.com", "test@email.com", "unit@test.com"]);
    expect(ssmMock.calls()).toHaveLength(1);
  });
  it("should throw proper error if value is not set", async () => {
    ssmMock.on(GetParameterCommand).resolves({
      Parameter: {},
    });
    await expect(getAllowList()).rejects.toThrow("unable to retrieve allowlist or value is empty");
  });
  it("should return empty array if value is invalid", async () => {
    ssmMock.on(GetParameterCommand).resolves({
      Parameter: {
        Value: '"invalid"',
      },
    });

    const list = await getAllowList();
    expect(list).toHaveLength(0);
  });

  it("should redact emails in all acceptable formats", () => {
    expect(
      redactEmailAddresses([
        "unittest@example.com",
        { name: "Unit Test", address: "unittest@example.com" },
      ])
    ).toEqual(["un****@example.com", { name: "Unit Test", address: "un****@example.com" }]);
    expect(redactEmailAddresses("unittest@example.com")).toEqual("un****@example.com");
    expect(redactEmailAddresses({ name: "Unit Test", address: "unittest@example.com" })).toEqual({
      name: "Unit Test",
      address: "un****@example.com",
    });
  });

  it("should leave legacy email payloads unchanged when realtime rendering is not needed", async () => {
    await expect(renderRealTimeEmails(mockEmailData)).resolves.toBe(mockEmailData);
  });
});
