import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";
import { beforeEach, describe, expect, it, vi } from "vitest";

const query = vi.fn();

vi.mock("./db", () => ({
  getDbPool: vi.fn(async () => ({ query })),
  getDbSchema: vi.fn(() => "demos_app"),
}));

import { getReferenceTermsEmailData } from "./referenceTerms";

const s3Mock = mockClient(S3Client);
const referenceConfigurationId = "6d8aa609-4968-4819-b673-fb0db01b2039";

describe("getReferenceTermsEmailData", () => {
  beforeEach(() => {
    query.mockReset();
    s3Mock.reset();
    process.env.CLEAN_BUCKET = "clean-bucket";
  });

  it("joins the reference configuration and retrieves its agreement from S3", async () => {
    query.mockResolvedValue({
      rows: [
        {
          referenceMaterialName: "National Quality Measures.zip",
          referenceAgreementId: "af00f9ba-3e71-4c99-ae43-eed45eb31041",
          referenceAgreementName: "Point and Click Agreement.pdf",
          referenceAgreementS3Path: "references/agreements/agreement-1",
        },
      ],
    });
    s3Mock.on(GetObjectCommand).resolves({
      Body: {
        transformToByteArray: async () => new Uint8Array([1, 2, 3]),
      } as any,
      ContentType: "application/pdf",
    });

    await expect(
      getReferenceTermsEmailData(referenceConfigurationId),
    ).resolves.toEqual({
      referenceMaterialName: "National Quality Measures.zip",
      referenceAgreementName: "Point and Click Agreement.pdf",
      attachment: {
        filename: "Point and Click Agreement.pdf",
        content: Buffer.from([1, 2, 3]),
        contentType: "application/pdf",
      },
    });
    expect(query).toHaveBeenCalledExactlyOnceWith(
      expect.stringMatching(
        /FROM demos_app\.reference_configuration[\s\S]+JOIN demos_app\.reference[\s\S]+JOIN demos_app\.reference_agreement/,
      ),
      [referenceConfigurationId],
    );
    expect(s3Mock.commandCalls(GetObjectCommand)[0].args[0].input).toEqual({
      Bucket: "clean-bucket",
      Key: "references/agreements/agreement-1",
    });
  });

  it("reports a missing reference configuration", async () => {
    query.mockResolvedValue({ rows: [] });

    await expect(
      getReferenceTermsEmailData(referenceConfigurationId),
    ).rejects.toThrow(
      `Reference configuration not found: ${referenceConfigurationId}`,
    );
  });

  it("reports a reference configuration without an agreement", async () => {
    query.mockResolvedValue({
      rows: [
        {
          referenceMaterialName: "National Quality Measures.zip",
          referenceAgreementId: null,
          referenceAgreementName: null,
          referenceAgreementS3Path: null,
        },
      ],
    });

    await expect(
      getReferenceTermsEmailData(referenceConfigurationId),
    ).rejects.toThrow(
      `Reference configuration has no agreement: ${referenceConfigurationId}`,
    );
    expect(s3Mock.commandCalls(GetObjectCommand)).toHaveLength(0);
  });

  it("reports a missing clean bucket", async () => {
    query.mockResolvedValue({
      rows: [
        {
          referenceMaterialName: "National Quality Measures.zip",
          referenceAgreementId: "af00f9ba-3e71-4c99-ae43-eed45eb31041",
          referenceAgreementName: "Point and Click Agreement.pdf",
          referenceAgreementS3Path: "references/agreements/agreement-1",
        },
      ],
    });
    delete process.env.CLEAN_BUCKET;

    await expect(
      getReferenceTermsEmailData(referenceConfigurationId),
    ).rejects.toThrow(
      "CLEAN_BUCKET is required to attach reference terms and conditions.",
    );
  });

  it("reports which agreement object could not be retrieved", async () => {
    query.mockResolvedValue({
      rows: [
        {
          referenceMaterialName: "National Quality Measures.zip",
          referenceAgreementId: "af00f9ba-3e71-4c99-ae43-eed45eb31041",
          referenceAgreementName: "Point and Click Agreement.pdf",
          referenceAgreementS3Path: "references/agreements/agreement-1",
        },
      ],
    });
    s3Mock.on(GetObjectCommand).rejects(new Error("NoSuchKey"));

    await expect(
      getReferenceTermsEmailData(referenceConfigurationId),
    ).rejects.toThrow(
      "Unable to retrieve reference agreement af00f9ba-3e71-4c99-ae43-eed45eb31041 " +
        "from s3://clean-bucket/references/agreements/agreement-1: NoSuchKey",
    );
  });

  it("reports an empty agreement object", async () => {
    query.mockResolvedValue({
      rows: [
        {
          referenceMaterialName: "National Quality Measures.zip",
          referenceAgreementId: "af00f9ba-3e71-4c99-ae43-eed45eb31041",
          referenceAgreementName: "Point and Click Agreement.pdf",
          referenceAgreementS3Path: "references/agreements/agreement-1",
        },
      ],
    });
    s3Mock.on(GetObjectCommand).resolves({});

    await expect(
      getReferenceTermsEmailData(referenceConfigurationId),
    ).rejects.toThrow(
      "Reference agreement file is empty: references/agreements/agreement-1",
    );
  });
});
