import { demonstrationResolvers } from "../../../model/demonstration/demonstrationResolvers";
import { Demonstration as PrismaDemonstration } from "@prisma/client";
import { State } from "../../../types";

export type GenerateDemonstrationInput = {
  name: string;
  description: string;
  projectOfficerUserId: string;
  stateId: State["id"];
};

export const generateDemonstration = async ({
  name,
  description,
  stateId,
  projectOfficerUserId,
}: GenerateDemonstrationInput): Promise<PrismaDemonstration> => {
  const demonstration = await demonstrationResolvers.Mutation.createDemonstration(null, {
    input: {
      name,
      description,
      stateId,
      projectOfficerUserId,
    },
  });
  return demonstration;
};
