import { Context } from "aws-lambda";

const STAGE = process.env.STAGE as string;
const REGION = process.env.AWS_REGION as string;
const DB_SECRET_ARN = process.env.DATABASE_SECRET_ARN as string;
let ACCOUNT_ID = "";

export function loadEnvs(context: Context) {
  ACCOUNT_ID = context.invokedFunctionArn.split(":")[4];

  console.log("STAGE", STAGE);
  console.log("DB_SECRET_ARN", DB_SECRET_ARN);
  if (!STAGE || !DB_SECRET_ARN) {
    throw new Error("STAGE and DATABASE_SECRET_ARN environment variables must be set");
  }
}

export function getStage() {
  return STAGE;
}

export function getRegion() {
  return REGION;
}

export function getAccountId() {
  return ACCOUNT_ID;
}

export function getDBSecretArn() {
  return DB_SECRET_ARN;
}
