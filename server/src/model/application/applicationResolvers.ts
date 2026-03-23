import { setApplicationClearanceLevel, PrismaApplication } from ".";

export const applicationResolvers = {
  Mutation: {
    setApplicationClearanceLevel: setApplicationClearanceLevel,
  },
  Application: {
    __resolveType: (parent: PrismaApplication) => parent.applicationTypeId,
  },
};
