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
    searchPeople: async (
      _: undefined,
      { search, demonstrationId }: { search: string; demonstrationId?: string },
    ) => {
      const searchConditions = [
        { firstName: { contains: search, mode: "insensitive" as const } },
        { lastName: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
      ];

      const baseWhere = {
        OR: searchConditions,
      };

      if (demonstrationId) {
        const demonstration = await prisma().demonstration.findUnique({
          where: { id: demonstrationId },
          include: { state: true },
        });

        if (demonstration) {
          return await prisma().person.findMany({
            where: {
              ...baseWhere,
              OR: [
                {
                  personTypeId: { not: "demos-state-user" },
                },
                {
                  personTypeId: "demos-state-user",
                  personStates: {
                    some: {
                      stateId: demonstration.stateId,
                    },
                  },
                },
              ],
            },
          });
        }
      }

      return await prisma().person.findMany({
        where: baseWhere,
      });
    },
  },

  Person: {
    fullName: (parent: Person) => {
      return [parent.firstName, parent.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();
    },
    personType: async (parent: Person) => {
      return parent.personTypeId;
    },
    roles: async (parent: Person) => {
      const roleAssignments =
        await prisma().demonstrationRoleAssignment.findMany({
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
    },
  },
};
