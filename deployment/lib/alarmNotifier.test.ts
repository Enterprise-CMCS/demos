import { CloudWatchAlarmEvent } from "aws-lambda";
import { handler } from "./alarmNotifier";

const { mockSsmSend } = vi.hoisted(() => ({
  mockSsmSend: vi.fn(),
}));

vi.mock(import("@aws-sdk/client-ssm"), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    SSMClient: vi.fn().mockImplementation(function () {
      return {
        send: mockSsmSend,
      };
    }),
  };
});

const alarmEvent = {
  alarmData: {
    alarmName: "demos-unittest-api-errors",
    configuration: {
      description: "[unittest] API Lambda has errors.",
    },
    state: {
      value: "ALARM",
      reason: "Threshold Crossed",
    },
    previousState: {
      value: "OK",
    },
  },
} as CloudWatchAlarmEvent;

describe("alarmNotifier", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        status: 200,
        text: async () => "ok",
      }))
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("posts alarm details to the configured webhook", async () => {
    mockSsmSend.mockResolvedValueOnce({
      Parameter: {
        Value: "https://hooks.slack.test/alarm",
      },
    });

    const response = await handler(alarmEvent);

    expect(mockSsmSend).toHaveBeenCalledWith(
      expect.objectContaining({
        input: {
          Name: "/demos/webhookUrl",
          WithDecryption: true,
        },
      })
    );
    expect(fetch).toHaveBeenCalledWith(
      "https://hooks.slack.test/alarm",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "[unittest] API Lambda has errors.",
          name: "demos-unittest-api-errors",
          state: "ALARM",
          reason: "Threshold Crossed",
          previousState: "OK",
        }),
      })
    );
    expect(response).toEqual({
      statusCode: 200,
      body: "ok",
    });
  });

  test("throws when the webhook parameter is blank", async () => {
    mockSsmSend.mockResolvedValueOnce({
      Parameter: {
        Value: "   ",
      },
    });

    await expect(handler(alarmEvent)).rejects.toThrow("webhook url is missing");
    expect(fetch).not.toHaveBeenCalled();
  });
});
