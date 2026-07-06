import {
  DemonstrationRoleAssignment as PrismaDemonstrationRoleAssignment,
  Person as PrismaPerson,
  State,
} from "@prisma/client";

import { selectManyPeople } from "./queries";
import { PersonType } from "../../types";
import { selectManyStates } from "../state/queries";
import { getManyDemonstrationRoleAssignments } from "../demonstrationRoleAssignment";
import { GraphQLContext } from "../../auth";
import { setPersonStates } from "../personState";

export const personResolvers = {
  Query: {
    people: (): Promise<PrismaPerson[]> => selectManyPeople({}),
  },

  Mutation: {
    setPersonStates: (
      parent: unknown,
      args: { personId: string; stateIds: State["id"][] }
    ): Promise<PrismaPerson> => {
      return setPersonStates(args.personId, args.stateIds);
    },
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
