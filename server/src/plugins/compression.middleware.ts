import type { IncomingMessage, ServerResponse } from "node:http";
import { promisify } from "node:util";
import { gzip, gzipSync } from "node:zlib";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import type { handlers, middleware } from "@as-integrations/aws-lambda";
import { log } from "../log.js";

const gzipAsync = promisify(gzip);

// Lambda refuses to return a response payload larger than this, which a single
// broad GraphQL query can exceed:
//   "Exceeded maximum allowed payload size (6291556 bytes)."
const LAMBDA_MAX_PAYLOAD_BYTES = 6_291_556;

// Warn while there is still headroom so an operation trending toward the cap
// shows up in CloudWatch before it starts failing.
const PAYLOAD_WARNING_BYTES = Math.floor(LAMBDA_MAX_PAYLOAD_BYTES * 0.8);

// Below this, gzip costs more in CPU and base64 overhead than it saves.
const MIN_BYTES_TO_COMPRESS = 1024;

type ProxyRequestHandler = handlers.RequestHandler<APIGatewayProxyEvent, APIGatewayProxyResult>;

function compressionDisabled(): boolean {
  return process.env.RESPONSE_COMPRESSION === "off";
}

function acceptsGzip(acceptEncoding: string | undefined): boolean {
  return (acceptEncoding ?? "")
    .toLowerCase()
    .split(",")
    .some((encoding) => encoding.trim().split(";")[0] === "gzip");
}

function acceptEncodingHeader(event: APIGatewayProxyEvent): string | undefined {
  // API Gateway passes headers through with whatever casing the client used.
  return Object.entries(event.headers ?? {}).find(
    ([name]) => name.toLowerCase() === "accept-encoding"
  )?.[1];
}

function withAcceptEncodingVary(
  vary: string | number | boolean | string[] | undefined
): string {
  const existing = (Array.isArray(vary) ? vary.join(",") : String(vary ?? ""))
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (existing.some((value) => value.toLowerCase() === "accept-encoding")) {
    return existing.join(", ");
  }
  return [...existing, "Accept-Encoding"].join(", ");
}

/**
 * Gzips the GraphQL JSON body before the handler returns it, so the payload
 * Lambda has to hand back stays well under its 6 MB ceiling. GraphQL responses
 * are repetitive JSON and typically compress 5-15x.
 *
 * The body is returned base64-encoded with `isBase64Encoded: true`; API Gateway
 * only decodes that back into bytes when the REST API declares binary media
 * types, so this pairs with `binaryMediaTypes` in deployment/lib/apigateway.ts.
 * Compression can be switched off in an emergency with RESPONSE_COMPRESSION=off.
 */
export const compressResponseMiddleware: middleware.MiddlewareFn<ProxyRequestHandler> = async (
  event
) => {
  if (compressionDisabled() || !acceptsGzip(acceptEncodingHeader(event))) return;

  return async (result) => {
    if (typeof result.body !== "string" || result.isBase64Encoded) return;

    const uncompressedBytes = Buffer.byteLength(result.body);
    if (uncompressedBytes < MIN_BYTES_TO_COMPRESS) return;

    let compressed: Buffer;
    try {
      compressed = await gzipAsync(result.body);
    } catch (error) {
      // An uncompressed response still has a chance of fitting; a thrown
      // middleware error does not.
      log.warn(
        { type: "graphql.response.compression_failed", uncompressedBytes },
        (error as Error).toString()
      );
      return;
    }

    const encodedBody = compressed.toString("base64");

    result.body = encodedBody;
    result.isBase64Encoded = true;
    result.headers = {
      ...result.headers,
      "content-encoding": "gzip",
      "content-length": compressed.byteLength.toString(),
      vary: withAcceptEncodingVary(result.headers?.vary),
    };

    const payloadBytes = Buffer.byteLength(encodedBody);
    const details = {
      type: "graphql.response.compressed",
      uncompressedBytes,
      compressedBytes: compressed.byteLength,
      payloadBytes,
    };

    if (payloadBytes > PAYLOAD_WARNING_BYTES) {
      log.warn(details, "Compressed response is approaching the Lambda payload limit");
    } else {
      log.debug(details);
    }
  };
};

/**
 * Gzips responses from the standalone dev server (src/local-server.ts) so local
 * behaviour matches deployed behaviour.
 *
 * startStandaloneServer owns its http server and writes the body itself, with
 * no middleware hook to wrap; the context function is the one place that still
 * has the response in hand before Apollo writes to it, so compression is
 * installed on the response there. Only complete string bodies are compressed —
 * a streamed body (incremental delivery) is written with res.write and passes
 * through untouched.
 */
export function compressStandaloneResponse(req: IncomingMessage, res: ServerResponse): void {
  if (compressionDisabled() || !acceptsGzip(req.headers["accept-encoding"])) return;

  const writeUncompressed = res.end.bind(res);

  res.end = function gzipThenEnd(chunk?: unknown, ...rest: unknown[]) {
    if (typeof chunk !== "string" || Buffer.byteLength(chunk) < MIN_BYTES_TO_COMPRESS) {
      return writeUncompressed(chunk as any, ...(rest as any));
    }

    const uncompressedBytes = Buffer.byteLength(chunk);
    let compressed: Buffer;
    try {
      compressed = gzipSync(chunk);
    } catch (error) {
      log.warn(
        { type: "graphql.response.compression_failed", uncompressedBytes },
        (error as Error).toString()
      );
      return writeUncompressed(chunk as any, ...(rest as any));
    }

    // Headers are still unsent at this point, so they can be corrected here.
    res.setHeader("content-encoding", "gzip");
    res.setHeader("content-length", compressed.byteLength);
    res.setHeader("vary", withAcceptEncodingVary(res.getHeader("vary")));

    log.debug({
      type: "graphql.response.compressed",
      uncompressedBytes,
      compressedBytes: compressed.byteLength,
    });

    return writeUncompressed(compressed as any, ...(rest as any));
  } as typeof res.end;
}
