import { demonstrationResolvers } from "../model/demonstration/demonstrationResolvers";
import { SdgDivision } from "../types";

export const generateDemonstration = async ({
  name,
  state,
  sdgDivision,
  projectOfficerUserId,
}: {
  name: string;
  state: string;
  sdgDivision: SdgDivision;
  projectOfficerUserId: string;
}) => {
  await demonstrationResolvers.Mutation.createDemonstration(null, {
    input: {
      name,
      description: `Description for ${name}`,
      sdgDivision,
      stateId: state,
      projectOfficerUserId,
    },
  });
};
