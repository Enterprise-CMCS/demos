import { setApplicationClearanceLevel, PrismaApplication } from ".";

export function resolveApplicationType(parent: PrismaApplication): string {
  return parent.applicationTypeId;
}

export const applicationResolvers = {
  Mutation: {
    setApplicationClearanceLevel: setApplicationClearanceLevel,
  },
  Application: {
    __resolveType: resolveApplicationType,
  },
};
