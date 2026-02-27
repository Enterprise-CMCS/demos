import { DirectiveHandler, FieldResolver } from "./directiveTransformer";
import { prisma } from "../../prismaClient";

const name = "assignedDemonstration";

const handler: DirectiveHandler = (proceed) => {
  const resolver: FieldResolver = async (source: { id: string }, args, context, info) => {
    const user = context.user;

    if (!user) {
      throw new Error("Unauthorized");
    }

    const result = await proceed(source, args, context, info);

    if (user.role === "demos-admin" || user.role === "demos-cms-user") {
      return result;
    }

    const assignedDemonstrationIds = (
      await prisma().demonstrationRoleAssignment.findMany({
        where: {
          personId: user.id,
          roleId: "State Point of Contact",
        },
      })
    ).map((assignment) => assignment.demonstrationId);

    result.filter((demonstration: { id: string }) =>
      assignedDemonstrationIds.includes(demonstration.id)
    );

    return result;
  };
  return resolver;
};

export const assignedDemonstrationDirective = { name, handler } as const;
