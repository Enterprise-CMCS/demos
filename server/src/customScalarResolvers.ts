import { GraphQLScalarType, Kind, StringValueNode } from "graphql";
import { DateTimeResolver, NonEmptyStringResolver } from "graphql-scalars";

export function generateCustomSetScalar(
  acceptableValues: readonly string[],
  name: string,
  description: string
): GraphQLScalarType {
  const scalarDescription =
    description + " Expected values are:\n- " + acceptableValues.join("\n- ");
  return new GraphQLScalarType({
    name: name,
    description: scalarDescription,
    serialize(value) {
      if (typeof value !== "string" || !acceptableValues.includes(value)) {
        throw new Error(
          `Invalid ${name} value: ${value}. Acceptable values are: ${acceptableValues.join(", ")}`
        );
      }
      return value;
    },
    parseValue(value) {
      if (typeof value !== "string" || !acceptableValues.includes(value)) {
        throw new Error(
          `Invalid ${name} value: ${value}. Acceptable values are: ${acceptableValues.join(", ")}`
        );
      }
      return value;
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.STRING) {
        const value = (ast as StringValueNode).value;
        if (!acceptableValues.includes(value)) {
          throw new Error(
            `Invalid ${name} value: ${value}. Acceptable values are: ${acceptableValues.join(", ")}`
          );
        }
        return value;
      }
      throw new Error(
        `${name} can only parse string values. Acceptable values are: ${acceptableValues.join(", ")}`
      );
    },
  });
}

export const customScalarResolvers = {
  DateTime: DateTimeResolver,
  NonEmptyString: NonEmptyStringResolver,
};
