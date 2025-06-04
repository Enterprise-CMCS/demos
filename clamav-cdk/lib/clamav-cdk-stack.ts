import {
  Duration,
  Stack,
  StackProps,
} from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import * as path from "path";

export class ClamavCdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    new lambda.Function(this, "ClamAVScanFunction", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "handler.scanFile", // From handler.js: `exports.scanFile = ...`
      code: lambda.Code.fromAsset(path.join(__dirname, "../clamav-lambda")),
      timeout: Duration.seconds(30),
      memorySize: 512,
      environment: {
        CLAMAV_BIN_PATH: "/var/task/clamav/clamscan.linux-amd64",
        CLAMAV_DB_PATH: "/var/task/clamav",
      },
    });
  }
}
