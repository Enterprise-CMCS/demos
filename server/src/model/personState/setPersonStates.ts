import type { Person as PrismaPerson } from "@prisma/client";
import { selectPersonOrThrow } from "../person/queries";
import { selectManyStates } from "../state/queries";
import type { State } from "../../types";
import { deleteManyPersonStates, insertManyPersonStates } from "./queries";
import { prisma } from "../../prismaClient";
import { checkPersonNotAssignedToDemonstrationOfStates } from "./checkPersonNotAssignedToDemonstrationOfStates";
import { cleanErrorsAndThrow } from "../../errors/cleanErrorsAndThrow";
import { checkPersonIsStateUser } from "./checkPersonIsStateUser";

export const setPersonStates = async (
  personId: string,
  stateIds: State["id"][]
): Promise<PrismaPerson> => {
  return prisma().$transaction(async (tx) => {
    const personTypeValidationResult = await checkPersonIsStateUser(personId, tx);
    if (personTypeValidationResult) {
      cleanErrorsAndThrow(
        [personTypeValidationResult],
        "setPersonStates",
        "SET_PERSON_STATES_VALIDATION_FAILED"
      );
    }

    const currentStateIds = await selectManyStates({
      personStates: {
        some: {
          personId,
        },
      },
    }).then((states) => states.map((state) => state.id));

    const statesToRemove = currentStateIds.filter((stateId) => !stateIds.includes(stateId));
    const statesToAdd = stateIds.filter((stateId) => !currentStateIds.includes(stateId));

    const demonstrationAssignmentValidationResult =
      await checkPersonNotAssignedToDemonstrationOfStates(personId, statesToRemove, tx);
    if (demonstrationAssignmentValidationResult) {
      cleanErrorsAndThrow(
        [demonstrationAssignmentValidationResult],
        "setPersonStates",
        "SET_PERSON_STATES_VALIDATION_FAILED"
      );
    }

    if (statesToRemove.length > 0) {
      await deleteManyPersonStates({
        personId,
        stateId: {
          in: statesToRemove,
        },
      });
    }

    if (statesToAdd.length > 0) {
      await insertManyPersonStates(
        statesToAdd.map((stateId) => ({
          personId,
          stateId,
        }))
      );
    }

    return selectPersonOrThrow({ id: personId });
  });
};
