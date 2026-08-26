import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";
import { beforeEach, describe, expect, it } from "vitest";

import { buildReferenceTermsAttachment } from "./emailAttachments";

const s3Mock = mockClient(S3Client);

describe("buildReferenceTermsAttachment", () => {
  beforeEach(() => {
    s3Mock.reset();
    process.env.CLEAN_BUCKET = "clean-bucket";
  });

  it("loads the accepted agreement from the clean bucket", async () => {
    s3Mock.on(GetObjectCommand).resolves({
      Body: {
        transformToByteArray: async () => new Uint8Array([1, 2, 3]),
      } as any,
      ContentType: "application/pdf",
    });

    await expect(
      buildReferenceTermsAttachment({
        termsAndConditions: {
          fileName: "Point and Click Agreement.pdf",
          s3Path: "reference-agreements/agreement-1",
        },
      }),
    ).resolves.toEqual({
      filename: "Point and Click Agreement.pdf",
      content: Buffer.from([1, 2, 3]),
      contentType: "application/pdf",
    });
    expect(s3Mock.commandCalls(GetObjectCommand)[0].args[0].input).toEqual({
      Bucket: "clean-bucket",
      Key: "reference-agreements/agreement-1",
    });
  });

  it("loads the point and click agreement from the clean bucket", async () => {
    s3Mock.on(GetObjectCommand).resolves({
      Body: {
        transformToByteArray: async () => new Uint8Array([1, 2, 3]),
      } as any,
      ContentType: "application/pdf",
    });

    await expect(
      buildReferenceTermsAttachment({
        termsAndConditions: {
          fileName: "point-click-agreement.pdf",
          s3Path: "references/agreements/point-click-agreement.pdf",
        },
      }),
    ).resolves.toEqual({
      filename: "point-click-agreement.pdf",
      content: Buffer.from([1, 2, 3]),
      contentType: "application/pdf",
    });
    expect(s3Mock.commandCalls(GetObjectCommand)[0].args[0].input).toEqual({
      Bucket: "clean-bucket",
      Key: "references/agreements/point-click-agreement.pdf",
    });
  });

  it("reports a missing clean bucket", async () => {
    delete process.env.CLEAN_BUCKET;

    await expect(
      buildReferenceTermsAttachment({
        termsAndConditions: {
          fileName: "Point and Click Agreement.pdf",
          s3Path: "reference-agreements/agreement-1",
        },
      }),
    ).rejects.toThrow(
      "CLEAN_BUCKET is required to attach reference terms and conditions.",
    );
  });

  it("reports an invalid agreement payload", async () => {
    await expect(buildReferenceTermsAttachment({})).rejects.toThrow(
      "Reference terms email payload is missing termsAndConditions.",
    );
  });
});
