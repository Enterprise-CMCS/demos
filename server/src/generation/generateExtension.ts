import { Extension as PrismaExtension } from "@prisma/client";
import { extensionResolvers } from "../model/extension/extensionResolvers";

export const generateExtension = async ({
  demonstrationId,
  name,
}: {
  demonstrationId: string;
  name: string;
}): Promise<PrismaExtension> => {
  const extension = await extensionResolvers.Mutation.createExtension(null, {
    input: {
      demonstrationId,
      name,
      description: `Description for ${name}`,
    },
  });
  return extension;
};
