import {
  Extension as PrismaExtension,
  Demonstration as PrismaDemonstration,
  Demonstration,
  Prisma,
} from "@prisma/client";
import { prisma } from "../../prismaClient.js";
import {
  ApplicationStatus,
  ApplicationType,
  CreateExtensionInput,
  PhaseName,
  UpdateExtensionInput,
} from "../../types.js";
import { checkOptionalNotNullFields } from "../../errors/checkOptionalNotNullFields.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import { parseAndValidateEffectiveAndExpirationDates } from "../applicationDate";
import {
  deleteApplication,
  getApplication,
  getManyApplications,
  resolveApplicationClearanceLevel,
  resolveApplicationSignatureLevel,
} from "../application";
import { getDocuments } from "../document/documentResolvers.js";
import { getApplicationPhases } from "../applicationPhase/applicationPhaseResolvers.js";
import { GraphQLContext } from "../../auth/auth.util.js";
import { GraphQLResolveInfo } from "graphql";
import { getCurrentPhaseName } from "../phase/phaseSchema.js";
import { getApplicationStatus } from "../applicationStatus/applicationStatusResolvers.js";
import { getApplicationTags } from "../tag/tagResolvers.js";
import { getClearanceLevel } from "../clearanceLevel/clearanceLevelResolvers.js";
import { getSignatureLevel } from "../signatureLevel/signatureLevelResolvers.js";
import { ExtensionResolvers } from "./extensionSchema.js";
import { getDemonstration } from "../demonstration/demonstrationResolvers.js";

const extensionApplicationType: ApplicationType = "Extension";
const conceptPhaseName: PhaseName = "Concept";
const newApplicationStatusId: ApplicationStatus = "Pre-Submission";

export async function getExtensions(
  parent: Demonstration,
  args: unknown,
  context: GraphQLContext,
  info: GraphQLResolveInfo
): Promise<PrismaExtension[]> {
  const parentType = info.parentType.name;
  let filter: Prisma.ExtensionWhereInput;
  switch (parentType) {
    case Prisma.ModelName.Demonstration:
      filter = {
        demonstrationId: (parent as Extract<typeof parent, Demonstration>).id,
      };
      break;
    default:
      throw new Error(`Unsupported parent type: ${parentType}`);
  }

  try {
    return await prisma().extension.findMany({
      where: { ...filter },
    });
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function __getExtension(
  parent: unknown,
  { id }: { id: string }
): Promise<PrismaExtension> {
  return await getApplication(id, { applicationTypeId: "Extension" });
}

export async function __getManyExtensions(): Promise<PrismaExtension[]> {
  return await getManyApplications("Extension");
}

export async function __createExtension(
  parent: unknown,
  { input }: { input: CreateExtensionInput }
): Promise<PrismaExtension> {
  return await prisma().$transaction(async (tx) => {
    const application = await tx.application.create({
      data: {
        applicationTypeId: extensionApplicationType,
      },
    });

    return await tx.extension.create({
      data: {
        id: application.id,
        applicationTypeId: application.applicationTypeId,
        demonstrationId: input.demonstrationId,
        name: input.name,
        description: input.description,
        statusId: newApplicationStatusId,
        currentPhaseId: conceptPhaseName,
        signatureLevelId: input.signatureLevel,
      },
    });
  });
}

export async function __updateExtension(
  parent: unknown,
  { id, input }: { id: string; input: UpdateExtensionInput }
): Promise<PrismaExtension> {
  const { effectiveDate } = parseAndValidateEffectiveAndExpirationDates(input);
  checkOptionalNotNullFields(["demonstrationId", "name", "status"], input);
  try {
    return await prisma().extension.update({
      where: {
        id: id,
      },
      data: {
        demonstrationId: input.demonstrationId,
        name: input.name,
        description: input.description,
        effectiveDate: effectiveDate,
        statusId: input.status,
        signatureLevelId: input.signatureLevel,
      },
    });
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function deleteExtension(
  parent: unknown,
  { id }: { id: string }
): Promise<PrismaExtension> {
  return await prisma().$transaction(async (tx) => {
    return await deleteApplication(id, "Extension", tx);
  });
}

export async function __resolveParentDemonstration(
  parent: PrismaExtension
): Promise<PrismaDemonstration> {
  // DB enforces that you cannot orphan the demonstration record
  const result = await prisma().demonstration.findUnique({
    where: { id: parent.demonstrationId },
  });
  return result!;
}

export const extensionResolvers: ExtensionResolvers = {
  Query: {
    extension: __getExtension,
    extensions: __getManyExtensions,
  },

  Mutation: {
    createExtension: __createExtension,
    updateExtension: __updateExtension,
    deleteExtension: deleteExtension,
  },

  Extension: {
    demonstration: getDemonstration,
    documents: getDocuments,
    currentPhaseName: getCurrentPhaseName,
    status: getApplicationStatus,
    phases: getApplicationPhases,
    clearanceLevel: getClearanceLevel,
    tags: getApplicationTags,
    signatureLevel: getSignatureLevel,
  },
};
