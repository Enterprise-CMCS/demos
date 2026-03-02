
const name = "belongsToDemonstration";

const validate = (source, args, context, info, directiveArgs) => {
  return source.id === "5270cc59-4689-46d6-a184-16026cf939e3";

  // const demonstrationRoleAssignment = prisma().demonstrationRoleAssignment.findMany({
  //   where: {
  //     personId: context.user?.id,
  //     demonstration: {
  //       id: source.id,
  //     },
  //   },
  // });

  // return demonstrationRoleAssignment.length > 0;
};

export const belongsToDemonstrationDirective = { name, validate } as const;
