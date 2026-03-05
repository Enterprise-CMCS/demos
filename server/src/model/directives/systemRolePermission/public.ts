import {
  AuthorizationCheckFunction,
  DirectiveConfiguration,
} from "../authenticationDirectiveTransformer";

const name = "public";

const checkAuthorization: AuthorizationCheckFunction = async () => {
  return true;
};

export const publicDirective: DirectiveConfiguration = { name, checkAuthorization };
