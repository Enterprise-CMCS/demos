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
