import { throwCustomGQLError } from "../errors/errorCodes";

export function throwApiNotReleasedError(apiName: string): never {
  throwCustomGQLError(
    `The query or mutator ${apiName} has not been released yet and cannot be used`,
    "NOT_RELEASED_ERROR"
  );
}
