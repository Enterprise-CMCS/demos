import { GraphQLScalarType, Kind, StringValueNode } from "graphql";
import { PHASE } from "../../constants.js";
import { Phase } from "../../types.js";

const phaseDescription = `
A string representing a phase of an application. Expected values are:
- None (only used for documents attached directly to an application)
- Concept
- State Application
- Completeness
- Federal Comment
- SME/FRT
- OGC & OMB
- Approval Package
- Post Approval
`;

export const phaseResolvers = {
  Phase: new GraphQLScalarType({
    name: "Phase",
    description: phaseDescription,
    serialize(value) {
      if (typeof value !== "string" || !PHASE.includes(value as Phase)) {
        throw new Error(
          `Invalid Phase value: ${value}. Acceptable values are: ${PHASE.join(", ")}`
        );
      }
      return value;
    },
    parseValue(value) {
      if (typeof value !== "string" || !PHASE.includes(value as Phase)) {
        throw new Error(
          `Invalid Phase value: ${value}. Acceptable values are: ${PHASE.join(", ")}`
        );
      }
      return value;
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.STRING) {
        const value = (ast as StringValueNode).value;
        if (!PHASE.includes(value as Phase)) {
          throw new Error(
            `Invalid Phase value: ${value}. Acceptable values are: ${PHASE.join(", ")}`
          );
        }
        return value;
      }
      throw new Error(
        `Phase can only parse string values. Acceptable values are: ${PHASE.join(", ")}`
      );
    },
  }),
};
