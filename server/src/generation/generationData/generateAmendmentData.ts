import { GenerateAmendmentOnDemonstrationInput } from "../application/modification/generateAmendmentOnDemonstration";

export const generateAmendmentData = ({
  demonstrationId,
  name,
}: {
  demonstrationId: string;
  name: string;
}): GenerateAmendmentOnDemonstrationInput => ({
  demonstrationId,
  name,
  description: `Amendment ${name} description`,
});
