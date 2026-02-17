import path from "node:path";
import {
  HeadObjectCommand,
  type HeadObjectCommandOutput,
  S3Client,
} from "@aws-sdk/client-s3";
import { CONTENT_TYPE_TO_EXTENSION } from "../constants.js";

type S3HeadClient = {
  send(command: HeadObjectCommand): Promise<HeadObjectCommandOutput>;
};

const s3MetadataClient = new S3Client(
  process.env.S3_ENDPOINT_LOCAL
    ? {
        region: "us-east-1",
        endpoint: process.env.S3_ENDPOINT_LOCAL,
        forcePathStyle: true,
        credentials: {
          accessKeyId: "test",
          secretAccessKey: "test", // pragma: allowlist secret
        },
      }
    : process.env.AWS_ENDPOINT_URL
      ? {
          region: process.env.AWS_REGION ?? "us-east-1",
          endpoint: process.env.AWS_ENDPOINT_URL,
          forcePathStyle: true,
        }
      : {
          region: process.env.AWS_REGION ?? "us-east-1",
        }
);

function extensionFromFileName(fileName?: string | null): string | null {
  if (!fileName) return null;
  const ext = path.extname(fileName).trim();
  return ext ? ext : null;
}

function extensionFromContentType(contentType?: string): string | null {
  if (!contentType) return null;
  const normalized = contentType.toLowerCase().split(";")[0].trim();
  return CONTENT_TYPE_TO_EXTENSION[normalized] ?? null;
}

function extractFileNameFromContentDisposition(contentDisposition?: string): string | null {
  if (!contentDisposition) return null;

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }

  const simpleMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  return simpleMatch?.[1] ?? null;
}

type ResolveFileNameWithExtensionInput = {
  bucket: string;
  key: string;
  documentName: string;
  s3Client?: S3HeadClient;
};

export async function resolveFileNameWithExtension({
  bucket,
  key,
  documentName,
  s3Client = s3MetadataClient,
}: ResolveFileNameWithExtensionInput): Promise<string> {
  const existingExtension = extensionFromFileName(documentName);
  if (existingExtension) {
    return documentName;
  }

  const head = await s3Client.send(
    new HeadObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );

  const metadata = head.Metadata ?? {};
  const metadataFileName =
    metadata.filename ??
    metadata["file-name"] ??
    metadata.originalfilename ??
    metadata["original-file-name"];

  const inferredExtension =
    extensionFromFileName(metadataFileName) ??
    extensionFromFileName(extractFileNameFromContentDisposition(head.ContentDisposition)) ??
    extensionFromContentType(head.ContentType);

  if (!inferredExtension) {
    throw new Error(
      `Unable to infer file extension for s3://${bucket}/${key}. Set object metadata filename/originalfilename or ContentType.`
    );
  }

  return `${documentName}${inferredExtension}`;
}
