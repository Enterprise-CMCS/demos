import { GraphQLError } from "graphql/error";
import { PersonType } from "../../types";
import { DirectiveHandler, FieldResolver } from "./directiveTransformer";

const name = "cmsOnly";

const handler: DirectiveHandler = (proceed) => {
  const resolver: FieldResolver = async (source, args, context, info) => {
    if (
      context.user?.role !== ("demos-admin" satisfies PersonType) &&
      context.user?.role !== ("demos-cms-user" satisfies PersonType)
    ) {
      throw new GraphQLError("STOP! YOU HAVE VIOLATED THE LAW! YOU ARE A STATE USER");
    }
    return await proceed(source, args, context, info);
  };
  return resolver;
};

export const cmsOnlyDirective = { name, handler } as const;
