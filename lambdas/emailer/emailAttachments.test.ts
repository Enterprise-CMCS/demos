import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";
import { beforeEach, describe, expect, it } from "vitest";

import { buildReferenceTermsAttachment } from "./emailAttachments";
import { POINT_AND_CLICK_AGREEMENT } from "./pointAndClickAgreement";

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

  it("loads the static point and click agreement", async () => {
    const attachment = await buildReferenceTermsAttachment({
      termsAndConditions: {
        fileName: POINT_AND_CLICK_AGREEMENT.fileName,
        s3Path: POINT_AND_CLICK_AGREEMENT.s3Path,
      },
    });

    expect(attachment).toEqual({
      filename: POINT_AND_CLICK_AGREEMENT.fileName,
      content: expect.any(Buffer),
      contentType: "application/pdf",
    });
    expect((attachment.content as Buffer).subarray(0, 5).toString()).toBe("%PDF-");
    expect(s3Mock.commandCalls(GetObjectCommand)).toHaveLength(0);
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
