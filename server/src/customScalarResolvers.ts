import { GraphQLScalarType, Kind, StringValueNode } from "graphql";
import { DateTimeResolver, LocalDateResolver, NonEmptyStringResolver } from "graphql-scalars";

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

export const DateTimeOrLocalDateResolver = new GraphQLScalarType({
  name: "DateTimeOrLocalDate",
  description:
    "Unions together the graphql-scalar types DateTime (ISO 8601 timestamp) and LocalDate (YYYY-MM-DD date).",

  serialize(value) {
    try {
      return DateTimeResolver.serialize(value);
    } catch {
      return LocalDateResolver.serialize(value);
    }
  },

  parseValue(value) {
    const valueParsers = [DateTimeResolver.parseValue, LocalDateResolver.parseValue];

    for (const valueParser of valueParsers) {
      try {
        return valueParser(value);
      } catch {
        continue;
      }
    }

    throw new Error(
      'Must be either DateTime (ISO 8601 timestamp like "2020-01-01T12:00:00.000Z") ' +
        'or LocalDate (date like "2020-01-01"). ' +
        `Received: ${value}`
    );
  },

  parseLiteral(ast) {
    const literalParsers = [DateTimeResolver.parseLiteral, LocalDateResolver.parseLiteral];

    for (const literalParser of literalParsers) {
      try {
        return literalParser(ast, null);
      } catch {
        continue;
      }
    }

    throw new Error(
      'Must be either DateTime (ISO 8601 timestamp like "2020-01-01T12:00:00.000Z") ' +
        'or LocalDate (date like "2020-01-01").'
    );
  },
});

export const customScalarResolvers = {
  DateTime: DateTimeResolver,
  DateTimeOrLocalDate: DateTimeOrLocalDateResolver,
  NonEmptyString: NonEmptyStringResolver,
};
