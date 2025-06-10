import { Fn } from "aws-cdk-lib";

export default function importNumberValue(name: string): number {
  return Fn.importValue(name) as unknown as number;
}
