import { Context } from "aws-lambda";
import { log } from "../log";

const STAGE = process.env.STAGE;
const REGION = process.env.AWS_REGION;
const DB_SECRET_ARN = process.env.DATABASE_SECRET_ARN;
let ACCOUNT_ID = "";

export function loadEnvs(context: Context) {
  ACCOUNT_ID = context.invokedFunctionArn.split(":")[4];

  log.info({"STAGE": STAGE, "DB_SECRET_ARN": DB_SECRET_ARN}, "environment variable details");
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
