export async function queryAtMostOne<PrismaWhereClause, FindManyResult>(
  model: {
    findMany(args: { where: PrismaWhereClause }): Promise<FindManyResult[]>;
  },
  where: PrismaWhereClause
): Promise<FindManyResult | null> {
  const result = await model.findMany({ where });

  if (result.length === 0) {
    return null;
  }
  if (result.length > 1) {
    throw new Error(`Expected to find at most one result, but found ${result.length}`);
  }
  return result[0];
}
