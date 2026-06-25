import { GraphQLError } from "graphql";

export function cleanErrorsAndThrow(
  errors: (string | undefined)[],
  mutator: string,
  code: string
): void {
  const cleanedErrors = errors.filter((e) => e !== undefined);
  if (cleanedErrors.length > 0) {
    throw new GraphQLError(`One or more validation checks for ${mutator} have failed.`, {
      extensions: {
        code: code,
        originalMessages: cleanedErrors,
      },
    });
  }
}
