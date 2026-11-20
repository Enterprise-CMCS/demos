import { addCognitoRedirect } from "../lib/addCognitoRedirect";
import { getOutputValue } from "../lib/getOutputValue";
import { getStackOutputs } from "../lib/getStackOutputs";

export async function addCloudfrontRedirect(environment: string) {
  const coreStackName = `demos-${environment}-core`;
  const uiStackName = `demos-${environment}-ui`;

  const coreOutputs = await getStackOutputs(coreStackName);
  const uiOutputs = await getStackOutputs(uiStackName);

  await addCognitoRedirect(
    getOutputValue(coreOutputs, `demos-${environment}-core`, "cognitoAuthority").split("/").pop()!,
    getOutputValue(coreOutputs, `demos-${environment}-core`, "cognitoClientId"),
    getOutputValue(uiOutputs, `demos-${environment}-ui`, "CloudfrontURL"),
  );

  console.log(`\n======\ncloudfront url added as a valid redirect\n======\n`);
  return 0;
}
