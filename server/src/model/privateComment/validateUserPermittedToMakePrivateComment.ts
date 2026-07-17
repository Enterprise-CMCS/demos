import { GraphQLContext } from "../../auth";
import { UserType } from "../../types";
import { AllowedPrivateCommenters } from "./queries";

export function validateUserPermittedToMakePrivateComment(
  context: GraphQLContext
): asserts context is GraphQLContext & { user: { personTypeId: AllowedPrivateCommenters } } {
  const allowedPrivateCommenters: UserType[] = [
    "demos-admin",
    "demos-cms-user",
  ] satisfies AllowedPrivateCommenters[];
  if (!allowedPrivateCommenters.includes(context.user.personTypeId)) {
    throw new Error(
      `The user with ID ${context.user.id} is not permitted to create a private comment; incorrect user type.`
    );
  }
}
