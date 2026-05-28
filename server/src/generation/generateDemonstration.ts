import { demonstrationResolvers } from "../model/demonstration/demonstrationResolvers";
import { Demonstration as PrismaDemonstration } from "@prisma/client";

export const generateDemonstration = async ({
  name,
  state,
  projectOfficerUserId,
}: {
  name: string;
  state: string;
  projectOfficerUserId: string;
}): Promise<PrismaDemonstration> => {
  const demonstration = await demonstrationResolvers.Mutation.createDemonstration(null, {
    input: {
      name,
      description: `Description for ${name}`,
      stateId: state,
      projectOfficerUserId,
    },
  });

  return demonstration;
};
