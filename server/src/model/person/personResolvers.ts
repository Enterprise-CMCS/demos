import { Person } from "@prisma/client";
import { prisma } from "../../prismaClient";

export const personResolvers = {
  Query: {
    person: async (_: undefined, { id }: { id: string }) => {
      return await prisma().person.findUnique({
        where: {
          id,
        },
      });
    },
    people: async () => {
      return await prisma().person.findMany();
    },
  },

  Person: {
    personType: async (parent: Person) => {
      return parent.personTypeId;
    },
    roles: async (parent: Person) => {
      const roleAssignments = await prisma().demonstrationRoleAssignment.findMany({
        where: { personId: parent.id },
        include: { primaryDemonstrationRoleAssignment: true },
      });
      return roleAssignments.map((assignment) => ({
        ...assignment,
        isPrimary: !!assignment.primaryDemonstrationRoleAssignment,
      }));
    },
    states: async (parent: Person) => {
      const personStates = await prisma().personState.findMany({
        where: { personId: parent.id },
        include: { state: true },
      });
      return personStates.map((ps) => ps.state);
    }
  },
};
