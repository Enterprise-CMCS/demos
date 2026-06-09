import { GenerateDemonstrationInput } from "../application/demonstration/generateDemonstration";

export const generateDemonstrationData = ({
  name,
  cmsUserId,
  stateId,
}: {
  name: string;
  cmsUserId: string;
  stateId: string;
}): GenerateDemonstrationInput => ({
  name,
  description: `Demonstration ${name} description`,
  projectOfficerUserId: cmsUserId,
  stateId,
});
