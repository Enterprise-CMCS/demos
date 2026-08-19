import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { gunzipSync } from "node:zlib";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { compressResponseMiddleware, compressStandaloneResponse } from "./compression.middleware";

vi.mock("../log.js", () => ({
  log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

function makeEvent(headers: Record<string, string> = {}): APIGatewayProxyEvent {
  return { headers, httpMethod: "POST", body: null } as unknown as APIGatewayProxyEvent;
}

function makeResult(body: string): APIGatewayProxyResult {
  return {
    statusCode: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-length": Buffer.byteLength(body).toString(),
    },
    body,
  };
}

// Repetitive JSON, comfortably over the 1 KB threshold.
const largeBody = JSON.stringify({
  data: { demonstrations: Array.from({ length: 200 }, (_, i) => ({ id: `demo-${i}`, name: "Test" })) },
});

async function runMiddleware(event: APIGatewayProxyEvent, result: APIGatewayProxyResult) {
  const onResult = await compressResponseMiddleware(event);
  if (typeof onResult === "function") await onResult(result);
  return onResult;
}

const originalCompressionSetting = process.env.RESPONSE_COMPRESSION;

beforeEach(() => {
  delete process.env.RESPONSE_COMPRESSION;
});

afterEach(() => {
  if (originalCompressionSetting === undefined) delete process.env.RESPONSE_COMPRESSION;
  else process.env.RESPONSE_COMPRESSION = originalCompressionSetting;
});

describe("compressResponseMiddleware", () => {
  it("gzips a large body into a base64 payload the client can decode", async () => {
    const result = makeResult(largeBody);

    await runMiddleware(makeEvent({ "Accept-Encoding": "gzip, deflate, br" }), result);

    expect(result.isBase64Encoded).toBe(true);
    expect(result.headers?.["content-encoding"]).toBe("gzip");
    expect(result.headers?.vary).toBe("Accept-Encoding");

    const compressed = Buffer.from(result.body, "base64");
    expect(gunzipSync(compressed).toString()).toBe(largeBody);
    expect(compressed.byteLength).toBeLessThan(Buffer.byteLength(largeBody));
  });

  it("reports the compressed byte length as content-length", async () => {
    const result = makeResult(largeBody);

    await runMiddleware(makeEvent({ "accept-encoding": "gzip" }), result);

    expect(result.headers?.["content-length"]).toBe(
      Buffer.from(result.body, "base64").byteLength.toString()
    );
  });

  it("leaves the response alone when the client does not accept gzip", async () => {
    const result = makeResult(largeBody);

    const onResult = await runMiddleware(makeEvent({ "Accept-Encoding": "br" }), result);

    expect(onResult).toBeUndefined();
    expect(result.body).toBe(largeBody);
    expect(result.isBase64Encoded).toBeUndefined();
  });

  it("leaves the response alone when there is no accept-encoding header", async () => {
    const result = makeResult(largeBody);

    await runMiddleware(makeEvent(), result);

    expect(result.body).toBe(largeBody);
  });

  it("does not treat a header value containing gzip as an accepted encoding", async () => {
    const result = makeResult(largeBody);

    await runMiddleware(makeEvent({ "Accept-Encoding": "notgzip" }), result);

    expect(result.body).toBe(largeBody);
  });

  it("skips bodies too small to be worth compressing", async () => {
    const smallBody = JSON.stringify({ data: { ok: true } });
    const result = makeResult(smallBody);

    await runMiddleware(makeEvent({ "accept-encoding": "gzip" }), result);

    expect(result.body).toBe(smallBody);
    expect(result.isBase64Encoded).toBeUndefined();
  });

  it("skips a body that is already base64 encoded", async () => {
    const result = { ...makeResult(largeBody), isBase64Encoded: true };

    await runMiddleware(makeEvent({ "accept-encoding": "gzip" }), result);

    expect(result.body).toBe(largeBody);
  });

  it("preserves any vary header the response already carries", async () => {
    const result = makeResult(largeBody);
    result.headers = { ...result.headers, vary: "Origin" };

    await runMiddleware(makeEvent({ "accept-encoding": "gzip" }), result);

    expect(result.headers?.vary).toBe("Origin, Accept-Encoding");
  });

  it("does not compress when RESPONSE_COMPRESSION is off", async () => {
    process.env.RESPONSE_COMPRESSION = "off";
    const result = makeResult(largeBody);

    const onResult = await runMiddleware(makeEvent({ "accept-encoding": "gzip" }), result);

    expect(onResult).toBeUndefined();
    expect(result.body).toBe(largeBody);
  });

  it("handles an error result that has no headers", async () => {
    const result = { statusCode: 400, body: largeBody } as APIGatewayProxyResult;

    await runMiddleware(makeEvent({ "accept-encoding": "gzip" }), result);

    expect(result.isBase64Encoded).toBe(true);
    expect(gunzipSync(Buffer.from(result.body, "base64")).toString()).toBe(largeBody);
  });
});

// Stands in for the node http response that startStandaloneServer writes to.
function makeStandaloneResponse() {
  const headers = new Map<string, string | number>();
  const ended: unknown[] = [];
  const res = {
    setHeader: (name: string, value: string | number) => headers.set(name.toLowerCase(), value),
    getHeader: (name: string) => headers.get(name.toLowerCase()),
    end: vi.fn((chunk?: unknown) => {
      ended.push(chunk);
      return res;
    }),
  };
  return { res: res as unknown as ServerResponse, headers, ended };
}

function makeRequest(headers: Record<string, string> = {}): IncomingMessage {
  return { headers } as unknown as IncomingMessage;
}

describe("compressStandaloneResponse", () => {
  it("gzips a large body and corrects the headers", () => {
    const { res, headers, ended } = makeStandaloneResponse();

    compressStandaloneResponse(makeRequest({ "accept-encoding": "gzip, deflate" }), res);
    res.end(largeBody);

    const written = ended[0] as Buffer;
    expect(Buffer.isBuffer(written)).toBe(true);
    expect(gunzipSync(written).toString()).toBe(largeBody);
    expect(headers.get("content-encoding")).toBe("gzip");
    expect(headers.get("content-length")).toBe(written.byteLength);
    expect(headers.get("vary")).toBe("Accept-Encoding");
  });

  it("leaves the response untouched when the client does not accept gzip", () => {
    const { res, headers, ended } = makeStandaloneResponse();

    compressStandaloneResponse(makeRequest({ "accept-encoding": "deflate" }), res);
    res.end(largeBody);

    expect(ended[0]).toBe(largeBody);
    expect(headers.has("content-encoding")).toBe(false);
  });

  it("passes small bodies through", () => {
    const { res, headers, ended } = makeStandaloneResponse();

    compressStandaloneResponse(makeRequest({ "accept-encoding": "gzip" }), res);
    res.end('{"data":{"ok":true}}');

    expect(ended[0]).toBe('{"data":{"ok":true}}');
    expect(headers.has("content-encoding")).toBe(false);
  });

  it("passes a streamed body through without setting content-encoding", () => {
    const { res, headers, ended } = makeStandaloneResponse();

    compressStandaloneResponse(makeRequest({ "accept-encoding": "gzip" }), res);
    res.end();

    expect(ended[0]).toBeUndefined();
    expect(headers.has("content-encoding")).toBe(false);
  });

  it("merges into an existing vary header", () => {
    const { res, headers } = makeStandaloneResponse();
    res.setHeader("vary", "Origin");

    compressStandaloneResponse(makeRequest({ "accept-encoding": "gzip" }), res);
    res.end(largeBody);

    expect(headers.get("vary")).toBe("Origin, Accept-Encoding");
  });

  it("does not patch the response when RESPONSE_COMPRESSION is off", () => {
    process.env.RESPONSE_COMPRESSION = "off";
    const { res, ended } = makeStandaloneResponse();

    compressStandaloneResponse(makeRequest({ "accept-encoding": "gzip" }), res);
    res.end(largeBody);

    expect(ended[0]).toBe(largeBody);
  });
});
