import { describe, it, expect, vi } from "vitest";
import { cookiePlugin } from "./cookie.plugin";

describe("cookiePlugin", () => {
  it("willSendResponse sets cookies on http.headers when present in context", async () => {
    const fakeHeaders = { set: vi.fn() } as any;
    const rc: any = {
      response: { http: { headers: fakeHeaders } },
      contextValue: { _setCookies: ["a=1; Path=/", "b=2; Path=/"] },
    };

    const start = await cookiePlugin.requestDidStart();
    // @ts-ignore - test harness
    await start!.willSendResponse(rc);

    expect(fakeHeaders.set).toHaveBeenCalledTimes(2);
    expect(fakeHeaders.set).toHaveBeenCalledWith("set-cookie", "a=1; Path=/");
    expect(fakeHeaders.set).toHaveBeenCalledWith("set-cookie", "b=2; Path=/");
  });

  it("willSendResponse no-op when no headers present", async () => {
    const rc: any = { response: { http: undefined }, contextValue: { _setCookies: ["c=3; Path=/"] } };
    const start = await cookiePlugin.requestDidStart();
    // should not throw
    // @ts-ignore
    await start!.willSendResponse(rc);
  });
});
