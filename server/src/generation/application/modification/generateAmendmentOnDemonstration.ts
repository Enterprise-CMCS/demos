import { Amendment as PrismaAmendment } from "@prisma/client";
import { amendmentResolvers } from "../../../model/amendment/amendmentResolvers";

export type GenerateAmendmentOnDemonstrationInput = {
  name: string;
  description: string;
  demonstrationId: string;
};

export const generateAmendmentOnDemonstration = async ({
  name,
  description,
  demonstrationId,
}: GenerateAmendmentOnDemonstrationInput): Promise<PrismaAmendment> => {
  const amendment = await amendmentResolvers.Mutation.createAmendment(null, {
    input: {
      name,
      description,
      demonstrationId,
    },
  });
  return amendment;
};
