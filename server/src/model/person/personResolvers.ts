import {
  DemonstrationRoleAssignment,
  Person,
  Prisma,
  Person as PrismaPerson,
} from "@prisma/client";

import { prisma } from "../../prismaClient";
import { GraphQLContext } from "../../auth/auth.util";
import { GraphQLResolveInfo } from "graphql";
import { handlePrismaError } from "../../errors/handlePrismaError";

export async function getPerson(
  parent: DemonstrationRoleAssignment,
  args: never,
  context: GraphQLContext,
  info: GraphQLResolveInfo
): Promise<Person | null> {
  const parentType = info.parentType.name;
  let filter: Prisma.PersonWhereUniqueInput;

  switch (parentType) {
    case Prisma.ModelName.DemonstrationRoleAssignment:
      filter = {
        id: (parent as Extract<typeof parent, DemonstrationRoleAssignment>).personId,
      };
      break;

    default:
      throw new Error(`Unsupported parent type: ${parentType}`);
  }

  try {
    return await prisma().person.findUnique({
      where: { ...filter },
    });
  } catch (error) {
    handlePrismaError(error);
  }
}

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
    roles: async (parent: PrismaPerson) => {
      const roleAssignments = await prisma().demonstrationRoleAssignment.findMany({
        where: { personId: parent.id },
        include: { primaryDemonstrationRoleAssignment: true },
      });
      return roleAssignments.map((assignment) => ({
        ...assignment,
        isPrimary: !!assignment.primaryDemonstrationRoleAssignment,
      }));
    },
    states: async (parent: PrismaPerson) => {
      const personStates = await prisma().personState.findMany({
        where: { personId: parent.id },
        include: { state: true },
      });
      return personStates.map((ps) => ps.state);
    },
  },
};
