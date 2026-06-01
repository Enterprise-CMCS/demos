import { amendmentResolvers } from "../model/amendment/amendmentResolvers";
import { Amendment as PrismaAmendment } from "@prisma/client";

export const generateAmendment = async ({
  demonstrationId,
  name,
}: {
  demonstrationId: string;
  name: string;
}): Promise<PrismaAmendment> => {
  const amendment = await amendmentResolvers.Mutation.createAmendment(null, {
    input: {
      demonstrationId,
      name,
      description: `Description for ${name}`,
    },
  });
  return amendment;
};
