import { Person as PrismaPerson } from "@prisma/client";

import { prisma } from "../../prismaClient";
import { selectManyDemonstrationRoleAssignments } from "../demonstrationRoleAssignment/queries";
import { getManyStates } from "../state";
import { selectManyPeople, selectPersonOrThrow } from "./queries";

export const personResolvers = {
  Query: {
    person: (parent: unknown, args: { id: string }) =>
      selectPersonOrThrow({ id: args.id }),
    people: () => selectManyPeople({}),
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
    roles: (parent: PrismaPerson) =>
      selectManyDemonstrationRoleAssignments({ personId: parent.id }),
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
