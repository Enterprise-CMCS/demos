import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { WrittenFile } from "../types";
import { uploadParquet, uploadSuccessMarker } from "./s3";

vi.mock("@aws-sdk/client-s3");
vi.mock("node:fs");
vi.mock("node:fs/promises");

const send = vi.mocked(S3Client.prototype.send as never) as unknown as ReturnType<typeof vi.fn>;
const commandInput = () => vi.mocked(PutObjectCommand).mock.calls[0][0];

const ORIGINAL_ENV = process.env;
const RUN_DATE = new Date("2026-09-04T07:00:00Z");

const WRITTEN: WrittenFile[] = [
  { relation: "balrogs", localPath: "/tmp/balrogs.parquet", rowCount: 412 },
  { relation: "ainur", localPath: "/tmp/ainur.parquet", rowCount: 56 },
];

beforeEach(() => {
  vi.clearAllMocks();
  process.env = { ...ORIGINAL_ENV, EXPORT_BUCKET: "demos-dev-dataconnect" };
  send.mockResolvedValue({});
  vi.mocked(stat).mockResolvedValue({ size: 98_304 } as never);
  vi.mocked(createReadStream).mockReturnValue("a-file-stream" as never);
});

afterEach(() => {
  process.env = ORIGINAL_ENV;
});

describe("the export bucket", () => {
  it("is refused when the environment variable is missing", async () => {
    // The bucket name reaches the lambda as an environment variable set from
    // bucket.bucketName in the CDK stack. There is no sensible default.
    delete process.env.EXPORT_BUCKET;
    await expect(uploadParquet("/tmp/balrogs.parquet", "k")).rejects.toThrow(
      "EXPORT_BUCKET is required to publish the export."
    );
  });

  it("is refused for the marker too, not just the data", async () => {
    delete process.env.EXPORT_BUCKET;
    await expect(uploadSuccessMarker(RUN_DATE, WRITTEN)).rejects.toThrow(
      "EXPORT_BUCKET is required to publish the export."
    );
  });

  it("is never read at module scope, so a value set after import still applies", async () => {
    process.env.EXPORT_BUCKET = "set-after-import";
    await uploadParquet("/tmp/balrogs.parquet", "k");
    expect(commandInput()).toMatchObject({ Bucket: "set-after-import" });
  });

  it("publishes nothing when the bucket is missing", async () => {
    delete process.env.EXPORT_BUCKET;
    await expect(uploadParquet("/tmp/x.parquet", "k")).rejects.toThrow();
    expect(send).not.toHaveBeenCalled();
  });
});

describe("uploadParquet", () => {
  it("puts the staged file at the given key", async () => {
    await uploadParquet("/tmp/balrogs.parquet", "balrogs/dt=2026-09-04/part-000.parquet");

    expect(send).toHaveBeenCalledTimes(1);
    expect(commandInput()).toEqual({
      Bucket: "demos-dev-dataconnect",
      Key: "balrogs/dt=2026-09-04/part-000.parquet",
      Body: "a-file-stream",
      ContentLength: 98_304,
      ContentType: "application/vnd.apache.parquet",
    });
  });

  it("streams the file rather than reading it into memory", async () => {
    await uploadParquet("/tmp/balrogs.parquet", "k");
    expect(vi.mocked(createReadStream)).toHaveBeenCalledWith("/tmp/balrogs.parquet");
  });

  it("takes ContentLength from stat, which is what a streamed body needs", async () => {
    // Without it the SDK cannot set x-amz-decoded-content-length, since the body is sent
    // with aws-chunked transfer encoding.
    vi.mocked(stat).mockResolvedValue({ size: 1 } as never);
    await uploadParquet("/tmp/balrogs.parquet", "k");
    expect(vi.mocked(stat)).toHaveBeenCalledWith("/tmp/balrogs.parquet");
    expect(commandInput()).toMatchObject({ ContentLength: 1 });
  });

  it("declares the parquet content type", async () => {
    await uploadParquet("/tmp/balrogs.parquet", "k");
    expect(commandInput()).toMatchObject({ ContentType: "application/vnd.apache.parquet" });
  });

  it("lets a failed put propagate so the handler can abort the run", async () => {
    send.mockRejectedValue(new Error("AccessDenied"));
    await expect(uploadParquet("/tmp/balrogs.parquet", "k")).rejects.toThrow("AccessDenied");
  });

  it("fails rather than uploading when the staged file is missing", async () => {
    vi.mocked(stat).mockRejectedValue(new Error("ENOENT: no such file or directory"));
    await expect(uploadParquet("/tmp/gone.parquet", "k")).rejects.toThrow("ENOENT");
    expect(send).not.toHaveBeenCalled();
  });
});

describe("uploadSuccessMarker", () => {
  it("writes the marker at the run-level key", async () => {
    // util/keys is deliberately not mocked, so the published key format is asserted here
    // as well as in its own test.
    await uploadSuccessMarker(RUN_DATE, WRITTEN);
    expect(commandInput()).toMatchObject({
      Bucket: "demos-dev-dataconnect",
      Key: "_run/dt=2026-09-04/_SUCCESS",
      ContentType: "application/json",
    });
  });

  it("records the run date and a row count per relation", async () => {
    await uploadSuccessMarker(RUN_DATE, WRITTEN);
    expect(JSON.parse(commandInput().Body as string)).toEqual({
      runDate: "2026-09-04T07:00:00.000Z",
      relations: [
        { relation: "balrogs", rowCount: 412 },
        { relation: "ainur", rowCount: 56 },
      ],
    });
  });

  it("keeps local staging paths out of the published manifest", async () => {
    // WrittenFile carries localPath. Publishing it would leak the lambda's /tmp layout
    // to every consumer of the bucket.
    await uploadSuccessMarker(RUN_DATE, WRITTEN);
    expect(commandInput().Body).not.toContain("/tmp");
    expect(commandInput().Body).not.toContain("localPath");
  });

  it("writes a marker with an empty relation list when nothing was exported", async () => {
    await uploadSuccessMarker(RUN_DATE, []);
    expect(JSON.parse(commandInput().Body as string)).toEqual({
      runDate: "2026-09-04T07:00:00.000Z",
      relations: [],
    });
  });

  it("lets a failed put propagate, so a run without a marker is a failed run", async () => {
    send.mockRejectedValue(new Error("AccessDenied"));
    await expect(uploadSuccessMarker(RUN_DATE, WRITTEN)).rejects.toThrow("AccessDenied");
  });
});

// The client is built at module scope, so these reset the module graph to observe the
// constructor argument. Kept last, since resetModules affects later imports.
describe("how the client is configured", () => {
  async function freshClient(env: Record<string, string | undefined>) {
    vi.resetModules();
    Object.assign(process.env, env);
    const { S3Client: Fresh } = await import("@aws-sdk/client-s3");
    await import("./s3");
    return vi.mocked(Fresh).mock.calls[0][0];
  }

  it("addresses AWS with the default virtual-hosted style", async () => {
    const config = await freshClient({ AWS_REGION: "us-east-1", AWS_ENDPOINT_URL: undefined });
    expect(config).toEqual({ region: "us-east-1", endpoint: undefined });
    expect(config).not.toHaveProperty("forcePathStyle");
  });

  it("switches to path-style addressing when pointed at localstack", async () => {
    // A bucket name in the hostname does not resolve against localstack, so phase 5
    // depends on this branch being taken whenever an endpoint override is present.
    expect(
      await freshClient({ AWS_REGION: "us-east-1", AWS_ENDPOINT_URL: "http://localhost:4566" })
    ).toEqual({
      region: "us-east-1",
      endpoint: "http://localhost:4566",
      forcePathStyle: true,
    });
  });
});
