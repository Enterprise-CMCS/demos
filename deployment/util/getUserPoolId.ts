import {CognitoIdentityProviderClient, ListUserPoolsCommand} from "@aws-sdk/client-cognito-identity-provider"

const client = new CognitoIdentityProviderClient({region: "us-east-1"})

export async function getUserPoolIdByName(name: string) {
  const listResponse = await client.send(new ListUserPoolsCommand({MaxResults: 10}))

  const match = listResponse.UserPools?.find(pool => pool.Name == name)
  if (match) {
    return match.Id
  }
}


