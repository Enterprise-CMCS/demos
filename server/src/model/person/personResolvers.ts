import {
  DemonstrationRoleAssignment as PrismaDemonstrationRoleAssignment,
  Person as PrismaPerson,
  State,
} from "@prisma/client";

import { selectManyPeople, selectPersonOrThrow } from "./queries";
import { PersonType } from "../../types";
import { selectManyStates } from "../state/queries";
import { getManyDemonstrationRoleAssignments } from "../demonstrationRoleAssignment";
import { GraphQLContext } from "../../auth";

export const personResolvers = {
  Query: {
    person: (parent: unknown, args: { id: string }): Promise<PrismaPerson> =>
      selectPersonOrThrow({ id: args.id }),
    people: (): Promise<PrismaPerson[]> => selectManyPeople({}),
  },

  Person: {
    fullName: (parent: PrismaPerson): string => `${parent.firstName} ${parent.lastName}`,
    personType: (parent: PrismaPerson): PersonType => parent.personTypeId as PersonType,
    roles: (
      parent: PrismaPerson,
      args: unknown,
      context: GraphQLContext
    ): Promise<PrismaDemonstrationRoleAssignment[]> =>
      getManyDemonstrationRoleAssignments({ personId: parent.id }, context.user),
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
