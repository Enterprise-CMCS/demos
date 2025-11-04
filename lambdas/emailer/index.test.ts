import {
  clearCache,
  EmailData,
  getAllowList,
  handler,
  isEmailerAddress,
  isValidEmailData,
  redactEmailAddresses,
  sendEmailIsAllowed,
  stripDisallowedFields,
} from ".";
import { log } from "./log";
import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm";
import { mockClient } from "aws-sdk-client-mock";
import { SQSEvent } from "aws-lambda";
import nodemailer, { SentMessageInfo } from "nodemailer";
import Mail, { Options } from "nodemailer/lib/mailer";

const mockEmailData = {
  to: "test@example.com",
  subject: "unit test subject",
  text: "unit test text",
};

const ssmMock = mockClient(SSMClient);
vi.mock("nodemailer");

describe("emailer", () => {
  beforeEach(() => {
    ssmMock.reset();
    clearCache();
    vi.clearAllMocks();
  });

  it("should properly handle a valid sqs event", async () => {
    const emailData = '{"to":"test@email.com","subject":"Unit Test","text":"this is the text body"}';
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
      () => ({ sendMail: sendMailSpy } as unknown as Mail<SentMessageInfo, Options>)
    );

    const out = await handler(mockEvent);
    expect(out).toEqual("success");
    expect(sendMailSpy).toHaveBeenCalledOnce();
    expect(sendMailSpy).toHaveBeenCalledWith(JSON.parse(emailData));
  });

  it("should properly handle a valid sqs event with email not in allowlist", async () => {
    const emailData = '{"to":"not-allowed@email.com","subject":"Unit Test","text":"this is the text body"}';
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
      () => ({ sendMail: sendMailSpy } as unknown as Mail<SentMessageInfo, Options>)
    );
    const infoSpy = vi.spyOn(log, "info");

    const out = await handler(mockEvent);
    expect(out).toEqual("success");
    expect(sendMailSpy).not.toHaveBeenCalled();
    expect(infoSpy).toHaveBeenCalledWith(expect.any(Object), "log only: email not in allowlist");
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
    expect(isEmailerAddress([{ name: "Unit Test", address: "test@email.com" }, "test@email.com"])).toEqual(true);

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
    expect(await sendEmailIsAllowed({ name: "Unit Test", address: "email@example.com" })).toEqual(true);
    expect(await sendEmailIsAllowed([{ name: "Unit Test", address: "email@example.com" }, "test@email.com"])).toEqual(
      true
    );
  });
  it("should return false when an invalid address is included", async () => {
    ssmMock.on(GetParameterCommand).resolves({
      Parameter: {
        Value: '["email@example.com","test@email.com","unit@test.com"]',
      },
    });
    expect(await sendEmailIsAllowed("bad@email.com")).toEqual(false);
    expect(await sendEmailIsAllowed({ name: "Unit Test", address: "bad@example.com" })).toEqual(false);
    expect(await sendEmailIsAllowed([{ name: "Unit Test", address: "bad@example.com" }, "test@email.com"])).toEqual(
      false
    );
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
  it("should throw proper error if value is not set", () => {
    ssmMock.on(GetParameterCommand).resolves({
      Parameter: {},
    });
    expect(() => getAllowList()).rejects.toThrow("unable to retrieve allowlist or value is empty");
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
      redactEmailAddresses(["unittest@example.com", { name: "Unit Test", address: "unittest@example.com" }])
    ).toEqual(["un****@example.com", { name: "Unit Test", address: "un****@example.com" }]);
    expect(redactEmailAddresses("unittest@example.com")).toEqual("un****@example.com");
    expect(redactEmailAddresses({ name: "Unit Test", address: "unittest@example.com" })).toEqual({
      name: "Unit Test",
      address: "un****@example.com",
    });
  });

  it("should remove invalid fields", () => {
    const warnSpy = vitest.spyOn(log, "warn");
    const output = stripDisallowedFields({ ...mockEmailData, invalid: "none" } as EmailData);
    expect(output).toEqual(mockEmailData);
    expect(warnSpy).toHaveBeenCalledOnce();
  });
});
