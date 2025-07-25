import {
  CognitoIdentityProviderClient,
  DescribeUserPoolClientCommand,
  UpdateUserPoolClientCommand,
} from "@aws-sdk/client-cognito-identity-provider";

export async function addCognitoRedirect(userPoolId: string, clientId: string, additionalRedirect: string) {
  const client = new CognitoIdentityProviderClient({ region: "us-east-1" });

  const current = await client.send(
    new DescribeUserPoolClientCommand({
      UserPoolId: userPoolId,
      ClientId: clientId,
    })
  );

  if (!current.UserPoolClient) {
    throw new Error("Could not find user pool client")
  }
  
  const existingUrls = current.UserPoolClient.CallbackURLs || [];
  console.log("additionalRedirect", additionalRedirect);
  const updatedUrls = Array.from(new Set([...existingUrls, additionalRedirect]));

  await client.send(
    new UpdateUserPoolClientCommand({
      ...current.UserPoolClient,
      UserPoolId: current.UserPoolClient.UserPoolId!,
      ClientId: current.UserPoolClient.ClientId!,
      CallbackURLs: updatedUrls,
    })
  );
}
