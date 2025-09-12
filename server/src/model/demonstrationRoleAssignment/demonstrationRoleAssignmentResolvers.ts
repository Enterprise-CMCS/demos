import { DemonstrationRoleAssignment } from "@prisma/client";

import { prisma } from "../../prismaClient.js";

export const demonstrationRoleAssigmentResolvers = {
  DemonstrationRoleAssignment: {
    person: async (parent: DemonstrationRoleAssignment) => {
      return await prisma().person.findUnique({
        where: { id: parent.personId },
      });
    },
    role: async (parent: DemonstrationRoleAssignment) => {
      return parent.roleId;
    },
    demonstration: async (parent: DemonstrationRoleAssignment) => {
      return await prisma().demonstration.findUnique({
        where: { id: parent.demonstrationId },
      });
    },
  },
};
