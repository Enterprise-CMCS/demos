import { GenerateExtensionOnDemonstrationInput } from "../application/modification/generateExtensionOnDemonstration";

export const generateExtensionData = ({
  demonstrationId,
  name,
}: {
  demonstrationId: string;
  name: string;
}): GenerateExtensionOnDemonstrationInput => ({
  demonstrationId,
  name,
  description: `Extension ${name} description`,
});
