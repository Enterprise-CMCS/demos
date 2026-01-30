import { prisma } from "../../../prismaClient";
import { ApplicationType } from "../../../types";
import {
  Demonstration as PrismaDemonstration,
  Amendment as PrismaAmendment,
  Extension as PrismaExtension,
} from "@prisma/client";
import { handlePrismaError } from "../../../errors/handlePrismaError";
import { PrismaApplication } from "..";

export async function deleteApplication(
  applicationId: string,
  applicationTypeId: "Demonstration"
): Promise<PrismaDemonstration>;

export async function deleteApplication(
  applicationId: string,
  applicationTypeId: "Amendment"
): Promise<PrismaAmendment>;

export async function deleteApplication(
  applicationId: string,
  applicationTypeId: "Extension"
): Promise<PrismaExtension>;

export async function deleteApplication(
  applicationId: string,
  applicationTypeId: ApplicationType
): Promise<PrismaApplication> {
  try {
    return await prisma().$transaction(async (tx) => {
      await tx.application.delete({
        where: {
          id: applicationId,
        },
      });

      switch (applicationTypeId) {
        case "Demonstration":
          return await tx.demonstration.delete({
            where: {
              id: applicationId,
            },
          });
        case "Amendment":
          return await tx.amendment.delete({
            where: {
              id: applicationId,
            },
          });
        case "Extension":
          return await tx.extension.delete({
            where: {
              id: applicationId,
            },
          });
      }
    });
  } catch (error) {
    handlePrismaError(error);
  }
}
