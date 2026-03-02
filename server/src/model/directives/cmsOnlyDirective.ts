import { PersonType } from "../../types";

const name = "cmsOnly";

const validate = (source, args, context, info, directiveArgs) => {
  // Return true if authorized, false otherwise (defaults to no permission)
  return (
    context.user?.role === ("demos-admin" satisfies PersonType) ||
    context.user?.role === ("demos-cms-user" satisfies PersonType)
  );
};

export const cmsOnlyDirective = { name, validate } as const;
