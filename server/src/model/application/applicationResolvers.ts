import { prisma } from "../../prismaClient";
import { ApplicationType } from "../../types";
import { getDemonstration } from "../demonstration/demonstrationResolvers.js";
import { getAmendment, getExtension } from "../modification/modificationResolvers.js";
import { Application } from "@prisma/client";

export async function getApplication(applicationId: string) {
  const application = await prisma().application.findUnique({
    where: {
      id: applicationId,
    },
    select: {
      applicationTypeId: true,
    },
  });

  if (!application) {
    throw new Error(`Application with ID ${applicationId} not found`);
  }

  switch (application.applicationTypeId as ApplicationType) {
    case "Demonstration":
      return await getDemonstration(undefined, { id: applicationId });
    case "Amendment":
      return await getAmendment(undefined, { id: applicationId });
    case "Extension":
      return await getExtension(undefined, { id: applicationId });
  }
}

export const applicationResolvers = {
  Application: {
    __resolveType: (parent: Application) => {
      return parent.applicationTypeId;
    },
  },
};
