import {DescribeManagedPrefixListsCommand, EC2Client, GetManagedPrefixListEntriesCommand} from "@aws-sdk/client-ec2"

const client = new EC2Client({region: "us-east-1"})

export async function getZScalerIps(): Promise<string[]> {
  const prefixLists = await client.send(new DescribeManagedPrefixListsCommand({}))

  const zscalerPl = prefixLists.PrefixLists?.find(pl => pl.PrefixListName == "zscaler")

  const plCmd = new GetManagedPrefixListEntriesCommand({PrefixListId: zscalerPl?.PrefixListId})

  const plResult = await client.send(plCmd)
  const cidrs = plResult.Entries?.map(e => e.Cidr).filter(e => e !== undefined)
  return cidrs || []
}
