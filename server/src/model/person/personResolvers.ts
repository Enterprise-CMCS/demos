import {
  DemonstrationRoleAssignment as PrismaDemonstrationRoleAssignment,
  Person as PrismaPerson,
  State,
} from "@prisma/client";

import { prisma } from "../../prismaClient";
import { selectManyDemonstrationRoleAssignments } from "../demonstrationRoleAssignment/queries";
import { selectManyPeople, selectPersonOrThrow } from "./queries";
import { PersonType } from "../../types";
import { selectManyStates } from "../state/queries";

export const personResolvers = {
  Query: {
    person: (parent: unknown, args: { id: string }): Promise<PrismaPerson> =>
      selectPersonOrThrow({ id: args.id }),
    people: (): Promise<PrismaPerson[]> => selectManyPeople({}),
    searchPeople: async (
      parent: unknown,
      { search, demonstrationId }: { search: string; demonstrationId?: string }
    ): Promise<PrismaPerson[]> => {
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
    fullName: (parent: PrismaPerson): string => `${parent.firstName} ${parent.lastName}`,
    personType: (parent: PrismaPerson): PersonType => parent.personTypeId as PersonType,
    roles: (parent: PrismaPerson): Promise<PrismaDemonstrationRoleAssignment[]> =>
      selectManyDemonstrationRoleAssignments({ personId: parent.id }),
    states: async (parent: PrismaPerson): Promise<State[]> =>
      selectManyStates({
        personStates: {
          some: {
            personId: parent.id,
          },
        },
      }),
  },
};
