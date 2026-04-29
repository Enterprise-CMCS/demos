import { Person as PrismaPerson } from "@prisma/client";

import { prisma } from "../../prismaClient";
import { GraphQLContext } from "../../auth";
import { getManyDemonstrationRoleAssignments } from "../demonstrationRoleAssignment";
import { getManyStates } from "../state";
import { getManyPeople, getPerson } from "./personData";

export const personResolvers = {
  Query: {
    person: async (parent: unknown, args: { id: string }, context: GraphQLContext) =>
      getPerson({ id: args.id }, context.user),
    people: async (parent: unknown, args: unknown, context: GraphQLContext) =>
      getManyPeople({}, context.user),
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
    fullName: (parent: PrismaPerson) => `${parent.firstName} ${parent.lastName}`,
    personType: async (parent: PrismaPerson) => parent.personTypeId,
    roles: (parent: PrismaPerson, args: unknown, context: GraphQLContext) =>
      getManyDemonstrationRoleAssignments({ personId: parent.id }, context.user),
    states: async (parent: PrismaPerson) =>
      getManyStates({
        personStates: {
          some: {
            personId: parent.id,
          },
        },
      }),
  },
};
