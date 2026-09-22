import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";
import { getAgreementAttachment } from "./agreementAttachment";

const s3 = mockClient(S3Client);
const payload = {
  agreement: { name: "Accepted Terms", s3Path: "agreement-key" },
};
beforeEach(() => {
  s3.reset();
  vi.stubEnv("CLEAN_BUCKET", "clean-bucket");
});
afterEach(() => vi.unstubAllEnvs());

it("loads the exact agreement bytes and supplies its filename and content type", async () => {
  s3.on(GetObjectCommand).resolves({
    Body: {
      transformToByteArray: async () => Buffer.from("agreement bytes"),
    } as never,
    ContentType: "application/pdf",
  });
  await expect(getAgreementAttachment(payload)).resolves.toEqual({
    filename: "Accepted Terms.pdf",
    content: Buffer.from("agreement bytes"),
    contentType: "application/pdf",
  });
  expect(s3.commandCalls(GetObjectCommand)[0].args[0].input).toEqual({
    Bucket: "clean-bucket",
    Key: "agreement-key",
  });
});

it("preserves a filename that already has its extension", async () => {
  s3.on(GetObjectCommand).resolves({
    Body: { transformToByteArray: async () => Buffer.from("terms") } as never,
    ContentType: "application/pdf",
  });
  await expect(
    getAgreementAttachment({
      agreement: { ...payload.agreement, name: "Terms.pdf" },
    })
  ).resolves.toMatchObject({ filename: "Terms.pdf" });
});

it("propagates S3 errors rather than omitting the attachment", async () => {
  s3.on(GetObjectCommand).rejects(new Error("NoSuchKey"));
  await expect(getAgreementAttachment(payload)).rejects.toThrow("NoSuchKey");
});

it("reports a missing attachment body", async () => {
  s3.on(GetObjectCommand).resolves({});
  await expect(getAgreementAttachment(payload)).rejects.toThrow("has no body: agreement-key");
});
