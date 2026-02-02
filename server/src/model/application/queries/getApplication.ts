import { prisma, PrismaTransactionClient } from "../../../prismaClient";
import { GraphQLError } from "graphql";
import { ApplicationType } from "../../../types";
import {
  Demonstration as PrismaDemonstration,
  Amendment as PrismaAmendment,
  Extension as PrismaExtension,
} from "@prisma/client";
import { PrismaApplication } from "..";

export async function getApplication(
  applicationId: string,
  applicationTypeId: "Demonstration",
  tx?: PrismaTransactionClient
): Promise<PrismaDemonstration>;

export async function getApplication(
  applicationId: string,
  applicationTypeId: "Amendment",
  tx?: PrismaTransactionClient
): Promise<PrismaAmendment>;

export async function getApplication(
  applicationId: string,
  applicationTypeId: "Extension",
  tx?: PrismaTransactionClient
): Promise<PrismaExtension>;

export async function getApplication(applicationId: string): Promise<PrismaApplication>;

export async function getApplication(
  applicationId: string,
  applicationTypeId?: ApplicationType,
  tx?: PrismaTransactionClient
): Promise<PrismaApplication> {
  const prismaClient = tx ?? prisma();
  const application = await prismaClient.application.findUnique({
    where: {
      id: applicationId,
      applicationTypeId: applicationTypeId,
    },
    include: {
      demonstration: true,
      amendment: true,
      extension: true,
    },
  });

  if (!application) {
    throw new GraphQLError(
      `Application of type ${applicationTypeId} with ID ${applicationId} not found`,
      {
        extensions: {
          code: "APPLICATION_ID_NOT_FOUND",
        },
      }
    );
  }

  // Note that one of these three will always exist because of DB constraints
  return (application.demonstration ?? application.amendment ?? application.extension)!;
}
