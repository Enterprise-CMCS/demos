import { Document as PrismaDocument, User as PrismaUser } from "@prisma/client";
import { GraphQLContext } from "../../auth/auth.util";
import { checkOptionalNotNullFields } from "../../errors/checkOptionalNotNullFields";
import { handlePrismaError } from "../../errors/handlePrismaError";
import { prisma } from "../../prismaClient";
import type {
  DocumentType,
  PhaseName,
  UpdateDocumentInput,
  UploadDocumentInput,
  UploadDocumentResponse,
  ApplicationDateInput,
} from "../../types";
import { getS3Adapter } from "../../adapters";
import { getEasternNow, parseJSDateToEasternTZDate } from "../../dateUtilities";
import { addDays } from "date-fns";
import path from "node:path";
import { getApplication, PrismaApplication } from "../application";
import { findUserById } from "../user";
import { validateAndUpdateDates } from "../applicationDate";
import { startPhaseByDocument } from "../applicationPhase";
import { enqueueUiPath, parseS3Path } from "../../services/uipathQueue";
import { UIPATH_PROJECT_IDS } from "../../constants";
import {
  checkDocumentExists,
  getDocumentById,
  updateDocument as updateDocumentQuery,
  handleDeleteDocument,
} from ".";

export async function getDocument(
  parent: unknown,
  { id }: { id: string }
): Promise<PrismaDocument> {
  return await prisma().$transaction(async (tx) => {
    return await getDocumentById(tx, id);
  });
}

export async function documentExists(_: unknown, { documentId }: { documentId: string }) {
  return await prisma().$transaction(async (tx) => {
    return checkDocumentExists(tx, documentId);
  });
}

export async function uploadDocument(
  parent: unknown,
  { input }: { input: UploadDocumentInput },
  context: GraphQLContext
): Promise<UploadDocumentResponse> {
  const s3Adapter = getS3Adapter();

  try {
    if (context.user === null) {
      throw new Error(
        "The GraphQL context does not have user information. Are you properly authenticated?"
      );
    }
    const userId = context.user.id;
    return await prisma().$transaction(async (tx) => {
      const easternNow = getEasternNow();
      const phaseStartDate = await startPhaseByDocument(tx, input.applicationId, input, easternNow);

      const datesToUpdate: ApplicationDateInput[] = [];

      if (phaseStartDate) {
        datesToUpdate.push(phaseStartDate);
      }

      if (input.documentType === "State Application" && input.phaseName === "Application Intake") {
        const currentDate = easternNow["Start of Day"].easternTZDate;

        datesToUpdate.push({
          dateType: "State Application Submitted Date",
          dateValue: currentDate,
        });

        const dueDatePlus15 = addDays(currentDate, 15);
        dueDatePlus15.setHours(23, 59, 59, 999);
        const completenessReviewDueDate = parseJSDateToEasternTZDate(dueDatePlus15);

        datesToUpdate.push({
          dateType: "Completeness Review Due Date",
          dateValue: completenessReviewDueDate.easternTZDate,
        });

        datesToUpdate.push({
          dateType: "Completeness Start Date",
          dateValue: currentDate,
        });
      }

      if (datesToUpdate.length > 0) {
        await validateAndUpdateDates(
          { applicationId: input.applicationId, applicationDates: datesToUpdate },
          tx
        );
      }

      return await s3Adapter.uploadDocument(tx, input, userId);
    });
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function resolvePresignedDownloadUrl(parent: Pick<PrismaDocument, "s3Path">) {
  const s3Adapter = getS3Adapter();
  try {
    return await s3Adapter.getPresignedDownloadUrl(parent.s3Path);
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function updateDocument(
  _: unknown,
  { id, input }: { id: string; input: UpdateDocumentInput }
): Promise<PrismaDocument> {
  checkOptionalNotNullFields(["name", "documentType", "applicationId", "phaseName"], input);
  try {
    return await prisma().$transaction(async (tx) => {
      return await updateDocumentQuery(tx, id, input);
    });
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function deleteDocument(_: unknown, { id }: { id: string }): Promise<PrismaDocument> {
  const s3Adapter = getS3Adapter();

  try {
    return prisma().$transaction(async (tx) => {
      return handleDeleteDocument(tx, s3Adapter, id);
    });
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function deleteDocuments(_: unknown, { ids }: { ids: string[] }): Promise<number> {
  const s3Adapter = getS3Adapter();

  try {
    return prisma().$transaction(async (tx) => {
      let count = 0;
      for (const documentId of ids) {
        await handleDeleteDocument(tx, s3Adapter, documentId);
        count++;
      }
      return count;
    });
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function triggerUiPath(
  _: unknown,
  { documentId, projectId }: { documentId: string; projectId?: string },
  context: GraphQLContext
): Promise<string> {
  try {
    if (context.user === null) {
      throw new Error(
        "The GraphQL context does not have user information. Are you properly authenticated?"
      );
    }

    return await prisma().$transaction(async (tx) => {
      const document = await getDocumentById(tx, documentId);
      const cleanBucket = process.env.CLEAN_BUCKET;
      const { bucket, key } = parseS3Path(document.s3Path, cleanBucket);

      if (cleanBucket && bucket !== cleanBucket) {
        throw new Error(`Document is not stored in the clean bucket: ${bucket}`);
      }

      const defaultProjectId = UIPATH_PROJECT_IDS[0] ?? "e797842e-acc4-f011-8194-001dd8017125";
      const resolvedProjectId = projectId ?? defaultProjectId;
      if (!resolvedProjectId) {
        throw new Error("Missing UiPath projectId for enqueue.");
      }
      // TODO: make this dynamic.
      const hasExtension = path.extname(document.name ?? "") !== "";
      const fileNameWithExtension = hasExtension ? document.name : `${document.name}.pdf`;

      return await enqueueUiPath({
        s3Bucket: bucket,
        s3FileName: key,
        projectId: resolvedProjectId,
        fileNameWithExtension,
      });
    });
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function resolveOwner(parent: PrismaDocument): Promise<PrismaUser> {
  try {
    return prisma().$transaction(async (tx) => {
      return findUserById(tx, parent.ownerUserId);
    });
  } catch (error) {
    handlePrismaError(error);
  }
}

export function resolveDocumentType(parent: PrismaDocument): DocumentType {
  return parent.documentTypeId as DocumentType;
}

export async function resolveApplication(parent: PrismaDocument): Promise<PrismaApplication> {
  return await getApplication(parent.applicationId);
}

export function resolvePhaseName(parent: PrismaDocument): PhaseName {
  return parent.phaseId as PhaseName;
}

export const documentResolvers = {
  Query: {
    document: getDocument,
    documentExists: documentExists,
  },

  Mutation: {
    uploadDocument: uploadDocument,
    updateDocument: updateDocument,
    deleteDocument: deleteDocument,
    deleteDocuments: deleteDocuments,
    triggerUiPath: triggerUiPath,
  },

  Document: {
    owner: resolveOwner,
    documentType: resolveDocumentType,
    presignedDownloadUrl: resolvePresignedDownloadUrl,
    application: resolveApplication,
    phaseName: resolvePhaseName,
  },
};
