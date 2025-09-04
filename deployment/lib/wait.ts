import { Aws, aws_lambda, CustomResource } from "aws-cdk-lib";
import { Construct } from "constructs";

export class Wait {
  // private static readonly LAMBDA_KEY = "SharedWaitLambda";

  public static forSeconds(scope: Construct, id: string, seconds: number): CustomResource {
    const waitLambda = aws_lambda.Function.fromFunctionName(scope, "SharedWaitLambda", `cdk-wait-${Aws.ACCOUNT_ID}`);
    return new CustomResource(scope, id, {
      serviceToken: waitLambda.functionArn,
      properties: { WaitTimeSeconds: seconds },
    });
  }
}
