import { Extension as PrismaExtension } from "@prisma/client";
import { extensionResolvers } from "../../../model/extension/extensionResolvers";

export type GenerateExtensionOnDemonstrationInput = {
  name: string;
  description: string;
  demonstrationId: string;
};

export const generateExtensionOnDemonstration = async ({
  name,
  description,
  demonstrationId,
}: GenerateExtensionOnDemonstrationInput): Promise<PrismaExtension> => {
  const extension = await extensionResolvers.Mutation.createExtension(null, {
    input: {
      name,
      description,
      demonstrationId,
    },
  });
  return extension;
};
