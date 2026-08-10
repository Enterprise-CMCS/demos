import { prisma, PrismaTransactionClient } from "../../prismaClient";
import { GetPresignedDownloadUrlOptions, S3Adapter } from "../";
import { sanitizeDownloadFileName } from "./sanitizeDownloadFileName";
import { Prisma, DocumentPendingUpload as PrismaDocumentPendingUpload } from "@prisma/client";
import { BN_WORKBOOK_DOCUMENT_TYPE } from "../../constants";

const HOSTNAME = "LocalS3Adapter";
const BUCKET_NAME = "local-demos-bucket";

/**
 * Creates a local in-memory adapter for simple local development.
 * Does not persist files - just tracks "uploaded" keys in memory.
 */
export function createLocalS3Adapter(): S3Adapter {
  const uploadedFiles = new Set<string>();
  const uploadedOnDemandReports = new Map<string, Buffer>();

  return {
    async getPresignedUploadUrl(key: string): Promise<string> {
      return `${HOSTNAME}/${BUCKET_NAME}/${key}?upload=true&expires=3600`;
    },

    async getPresignedDownloadUrl(
      key: string,
      fileName?: string,
      options?: GetPresignedDownloadUrlOptions
    ): Promise<string> {
      // Fake URLs only — just reflect the sanitized name/disposition for local dev visibility.
      const fileNameParam = fileName
        ? `&fileName=${encodeURIComponent(
            sanitizeDownloadFileName(fileName, key.split("/").pop() ?? key)
          )}&disposition=${options?.disposition ?? "inline"}`
        : "";

      if (uploadedFiles.has(key)) {
        return `${HOSTNAME}/${BUCKET_NAME}/${key}?download=true&expires=3600${fileNameParam}`;
      }

      const onDemandReport = uploadedOnDemandReports.get(key);
      if (onDemandReport) {
        return `${HOSTNAME}/${BUCKET_NAME}/${key}?download=true&expires=3600&size=${onDemandReport.byteLength}${fileNameParam}`;
      }

      return `${key} does not exist!`;
    },

    // No stored Content-Type locally, so the name comes back without an extension.
    async getDownloadFileName(key: string, fileName: string): Promise<string> {
      return sanitizeDownloadFileName(fileName, key.split("/").pop() ?? key);
    },

    async moveDocumentFromCleanToDeleted(key: string): Promise<void> {
      uploadedFiles.delete(key);
    },

    async uploadDocument(
      documentData: Prisma.DocumentPendingUploadCreateArgs["data"],
      tx?: PrismaTransactionClient
    ): Promise<PrismaDocumentPendingUpload> {
      const createPendingDocumentAndDocument = async (transaction: PrismaTransactionClient) => {
        const documentPendingUpload = await transaction.documentPendingUpload.create({
          data: documentData,
        });
        uploadedFiles.add(documentPendingUpload.id);
        await transaction.document.create({
          data: {
            ...documentData,
            id: documentPendingUpload.id,
            s3Path: `${HOSTNAME}/${BUCKET_NAME}/${documentPendingUpload.id}`,
          },
        });
        // Deployed, the clean-move SQL creates this row (as "Pending") once GuardDuty clears
        // the file. That step is bypassed here, so create it inline to satisfy the
        // check_budget_neutrality_validation_record_exists constraint trigger on `document`.
        if (documentData.documentTypeId === BN_WORKBOOK_DOCUMENT_TYPE) {
          await transaction.budgetNeutralityWorkbook.create({
            data: {
              id: documentPendingUpload.id,
              documentTypeId: BN_WORKBOOK_DOCUMENT_TYPE,
              validationStatusId: "Pending",
              validationData: {},
            },
          });
        }
        return documentPendingUpload;
      };

      if (tx) {
        return createPendingDocumentAndDocument(tx);
      }
      return prisma().$transaction(async (transaction) => {
        return createPendingDocumentAndDocument(transaction);
      });
    },

    async uploadOnDemandReport(reportId: string, reportFileData: Buffer): Promise<string> {
      const key = `reports/on-demand/${reportId}.xlsx`;
      uploadedOnDemandReports.set(key, reportFileData);
      return key;
    },

    async deleteOnDemandReport(reportId: string): Promise<string> {
      const key = `reports/on-demand/${reportId}.xlsx`;
      uploadedOnDemandReports.delete(key);
      return key;
    },
  };
}
