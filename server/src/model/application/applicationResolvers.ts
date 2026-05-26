import { setApplicationClearanceLevel, PrismaApplication } from ".";
import { ApplicationType } from "../../types";

export const applicationResolvers = {
  Mutation: {
    setApplicationClearanceLevel: setApplicationClearanceLevel,
  },
  Application: {
    __resolveType: (parent: PrismaApplication): ApplicationType =>
      parent.applicationTypeId as ApplicationType,
  },
};
