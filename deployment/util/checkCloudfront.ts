import { CloudFrontClient, ListDistributionsCommand } from "@aws-sdk/client-cloudfront";

const client = new CloudFrontClient({region: "us-east-1"});

export async function configuredDistributionExists(stage: string) {
  const command = new ListDistributionsCommand({});
  const resp = await client.send(command)
  const distributions = resp.DistributionList?.Items ?? []

  // The comment will only include the stage name after the final configuration is applied
  const dist = distributions.find(d => d.Comment?.includes(stage));

  return !!dist
}
