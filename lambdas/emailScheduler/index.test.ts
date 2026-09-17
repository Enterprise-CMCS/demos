import type { Context, SQSEvent } from "aws-lambda";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getDbPoolMock: vi.fn(),
  poolConnectMock: vi.fn(),
  clientReleaseMock: vi.fn(),
  enqueueDeliverableDueDateNotificationMock: vi.fn(),
  enqueueDemonstrationExpirationDateNotificationMock: vi.fn(),
  reqIdChildMock: vi.fn(),
  logInfoMock: vi.fn(),
  SQSClientMock: vi.fn(),
}));

vi.mock("./log", () => ({
  als: { run: (_store: unknown, fn: () => unknown) => fn() },
  store: new Map<string, string>(),
  reqIdChild: (...args: unknown[]) => mocks.reqIdChildMock(...args),
  log: { info: (...args: unknown[]) => mocks.logInfoMock(...args) },
}));

vi.mock("./db", () => ({
  getDbPool: (...args: unknown[]) => mocks.getDbPoolMock(...args),
}));

vi.mock(
  "./notifications/deliverableDueDateNotification/enqueueDeliverableDueDateNotification",
  () => ({
    enqueueDeliverableDueDateNotification: (...args: unknown[]) =>
      mocks.enqueueDeliverableDueDateNotificationMock(...args),
  })
);

vi.mock(
  "./notifications/demonstrationExpirationDateNotification/enqueueDemonstrationExpirationDateNotification",
  () => ({
    enqueueDemonstrationExpirationDateNotification: (...args: unknown[]) =>
      mocks.enqueueDemonstrationExpirationDateNotificationMock(...args),
  })
);

vi.mock("@aws-sdk/client-sqs", () => ({
  SQSClient: mocks.SQSClientMock,
}));

import { handler } from ".";

const CLIENT = { release: mocks.clientReleaseMock };
const POOL = { connect: mocks.poolConnectMock };

const event = {} as SQSEvent;
const context = { awsRequestId: "req-123" } as Context;

describe("emailScheduler handler", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.getDbPoolMock.mockResolvedValue(POOL);
    mocks.poolConnectMock.mockResolvedValue(CLIENT);
    mocks.enqueueDeliverableDueDateNotificationMock.mockResolvedValue(undefined);
    mocks.enqueueDemonstrationExpirationDateNotificationMock.mockResolvedValue(undefined);
  });

  it("connects a single client, runs each email type with it, and releases it", async () => {
    await handler(event, context);

    expect(mocks.reqIdChildMock).toHaveBeenCalledExactlyOnceWith(context.awsRequestId);
    expect(mocks.getDbPoolMock).toHaveBeenCalledOnce();
    expect(mocks.poolConnectMock).toHaveBeenCalledOnce();
    expect(mocks.SQSClientMock).toHaveBeenCalledExactlyOnceWith({
      region: process.env.AWS_REGION,
      endpoint: process.env.AWS_ENDPOINT_URL,
    });
    expect(mocks.enqueueDeliverableDueDateNotificationMock).toHaveBeenCalledExactlyOnceWith(
      CLIENT,
      expect.any(Object)
    );
    expect(
      mocks.enqueueDemonstrationExpirationDateNotificationMock
    ).toHaveBeenCalledExactlyOnceWith(CLIENT, expect.any(Object));
    expect(mocks.clientReleaseMock).toHaveBeenCalledOnce();
  });

  it("releases the client even when a notification throws", async () => {
    mocks.enqueueDeliverableDueDateNotificationMock.mockRejectedValue(new Error("boom"));

    await expect(handler(event, context)).rejects.toThrow("boom");

    expect(mocks.clientReleaseMock).toHaveBeenCalledOnce();
  });
});
