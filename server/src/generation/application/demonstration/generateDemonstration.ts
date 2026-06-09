import { demonstrationResolvers } from "../../../model/demonstration/demonstrationResolvers";
import { Demonstration as PrismaDemonstration } from "@prisma/client";
import { SdgDivision, State } from "../../../types";

export type GenerateDemonstrationInput = {
  name: string;
  description: string;
  projectOfficerUserId: string;
  stateId: State["id"];
  sdgDivision?: SdgDivision;
};

export const generateDemonstration = async ({
  name,
  description,
  stateId,
  projectOfficerUserId,
  sdgDivision,
}: GenerateDemonstrationInput): Promise<PrismaDemonstration> => {
  const demonstration = await demonstrationResolvers.Mutation.createDemonstration(null, {
    input: {
      name,
      description,
      stateId,
      projectOfficerUserId,
      sdgDivision,
    },
  });
  return demonstration;
};
