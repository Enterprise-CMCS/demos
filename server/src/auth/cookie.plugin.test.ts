import { describe, expect, it } from "vitest";
import { cookiePlugin } from "./cookie.plugin.js";

describe("cookiePlugin", () => {
  it("sets set-cookie header values from context cookies", async () => {
    const hooks = await cookiePlugin.requestDidStart?.({} as any);
    const headers = new Headers();

    await hooks?.willSendResponse?.({
      response: { http: { headers } },
      contextValue: {
        _setCookies: ["first=1; Path=/", "second=2; Path=/"],
      },
    } as any);

    expect(headers.get("set-cookie")).toBe("second=2; Path=/");
  });

  it("does nothing when response headers are missing", async () => {
    const hooks = await cookiePlugin.requestDidStart?.({} as any);

    await expect(
      hooks?.willSendResponse?.({
        response: {},
        contextValue: {
          _setCookies: ["a=1"],
        },
      } as any)
    ).resolves.toBeUndefined();
  });
});
