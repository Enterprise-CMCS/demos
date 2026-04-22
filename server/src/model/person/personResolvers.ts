import { Person as PrismaPerson } from "@prisma/client";

import { prisma } from "../../prismaClient";
import { GraphQLContext } from "../../auth";
import { getManyDemonstrationRoleAssignments } from "../demonstrationRoleAssignment";

export const personResolvers = {
  Query: {
    person: async (_: unknown, { id }: { id: string }) => {
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
      _: unknown,
      { search, demonstrationId }: { search: string; demonstrationId?: string }
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
    fullName: (parent: PrismaPerson) => {
      return [parent.firstName, parent.lastName].filter(Boolean).join(" ").trim();
    },
    personType: async (parent: PrismaPerson) => {
      return parent.personTypeId;
    },
    roles: (parent: PrismaPerson, args: unknown, context: GraphQLContext) =>
      getManyDemonstrationRoleAssignments({ personId: parent.id }, context.user),

    states: async (parent: PrismaPerson) => {
      const personStates = await prisma().personState.findMany({
        where: { personId: parent.id },
        include: { state: true },
      });
      return personStates.map((ps) => ps.state);
    },
  },
};
