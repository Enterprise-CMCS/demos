import { getInnermostScope } from "eslint-utils";
import { parse } from "graphql";

import { ESLintUtils } from "@typescript-eslint/utils";

/**
 * Wishlist:
 * 1. Better support for lists (inner type matches)
 * 2. Support enums
 * 3. Get this to work with type aliases
 */
const createRule = ESLintUtils.RuleCreator((name) => name);

const STRING = "string";
const NUMBER = "number";
const BOOLEAN = "boolean";
const LIST = "list";
const OBJECT = "object";

const GQL_NAMED_TYPE = "NamedType";
const GQL_LIST_TYPE = "ListType";
const GQL_NON_NULL_TYPE = "NonNullType";

const GQL_TYPE_TO_NORMALIZED_TYPE = {
  String: STRING,
  Int: NUMBER,
  Float: NUMBER,
  Boolean: BOOLEAN,
  ID: STRING,
  JSONObject: OBJECT,
};

const TS_INTERFACE_DECLARATION = "TSInterfaceDeclaration";

const TS_AST_TYPE_TO_NORMALIZED_TYPE = {
  TSStringKeyword: STRING,
  TSNumberKeyword: NUMBER,
  TSBooleanKeyword: BOOLEAN,
  TSArrayType: LIST,
  TSObjectKeyword: OBJECT,
};

// Checks if a graphQL schema variable is valid
const isValidGraphQLSchema = (variable) => {
  try {
    parse(variable.defs[0].node.init.quasi.quasis[0].value.raw);
    return true;
  } catch {
    return false;
  }
};

// Gets the normalized type of a GraphQL field
const getTypeOfGqlField = (field) => {
  const getFieldType = () => {
    switch (field.type.kind) {
      case GQL_NAMED_TYPE:
        return field.type.name.value;
      case GQL_LIST_TYPE:
        return LIST;
      case GQL_NON_NULL_TYPE:
        switch (field.type.type.kind) {
          case GQL_NAMED_TYPE:
            return field.type.type.name.value;
          case GQL_LIST_TYPE:
            return LIST;
          default:
            throw new Error(`Unknown field type: ${field.type.type.kind}`);
        }
      default:
        throw new Error(`Unknown field type: ${field.type.kind}`);
    }
  };

  const fieldType = getFieldType();
  const normalizedType = GQL_TYPE_TO_NORMALIZED_TYPE[fieldType] || fieldType;
  return normalizedType;
};

// Gets normalized field information from the TypeScript AST
const getTsFieldInfo = (field) => {
  const keyName = field.key?.name || field.key?.value || "unknown";

  const typeNode = field.typeAnnotation?.typeAnnotation;
  let tsType = "unknown";

  if (typeNode) {
    tsType =
      TS_AST_TYPE_TO_NORMALIZED_TYPE[typeNode.type] ||
      typeNode.typeName?.name ||
      "unknown";
  }

  return {
    name: keyName,
    type: tsType,
    nullable: field.optional ?? true,
    loc: field.loc,
  };
};

// Gets normalized field information from the GraphQL AST
const getGqlFieldInfo = (field) => {
  const gqlFields = {
    name: field.name.value,
    type: getTypeOfGqlField(field),
    nullable: field.type.kind !== GQL_NON_NULL_TYPE,
  };

  return gqlFields;
};

// Get the variable with the gql tag
const getGQLVariable = (variableScope) => {
  return variableScope.variables.find((variable) => {
    if (!Object.prototype.hasOwnProperty.call(variable, "defs")) {
      return false;
    }

    return (
      variable.defs[0].node.type === "VariableDeclarator" &&
      variable.defs[0].node.init.type === "TaggedTemplateExpression" &&
      variable.defs[0].node.init.tag.name === "gql"
    );
  });
};

// Compare the field types of the GraphQL schema and the TypeScript types
const compareFieldTypes = (gqlFields, tsFields, tsNode, context) => {
  // Guard: All fields in gqlFields should exist in tsFields
  for (const gqlField of gqlFields) {
    const tsField = tsFields.find((field) => field.name === gqlField.name);

    if (!tsField) {
      context.report({
        node: tsNode,
        message: `The field "${gqlField.name}" is missing in the TypeScript interface`,
      });
    }
  }

  // Guard: Types of the field should match
  for (const tsField of tsFields) {
    const gqlField = gqlFields.find((field) => field.name === tsField.name);

    // Guard: The field should exist in the GraphQL schema
    if (!gqlField) {
      context.report({
        node: tsField,
        message: `The field "${tsField.name}" is missing in the GraphQL schema`,
      });
      continue;
    }

    // Guard: Types of the field should match
    if (gqlField.type !== tsField.type) {
      context.report({
        node: tsField,
        message: `The field "${tsField.name}" has a type mismatch. Expected "${gqlField.type}", but got "${tsField.type}"`,
      });
    }

    // Guard: Nullability of the field should match
    if (gqlField.nullable !== tsField.nullable) {
      context.report({
        node: tsField,
        message: `The field "${tsField.name}" has a nullability mismatch. Expected "${gqlField.nullable}", but got "${tsField.nullable}"`,
      });
    }
  }
};

export const validateGraphQLTypescriptMatch = createRule({
  name: "validate-graphql-typescript-match",
  meta: {
    docs: {
      description:
        "Validate that GraphQL types and TypeScript interfaces match",
      recommended: "error",
    },
    type: "problem",
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      Program(programNode) {
        // Scope to the file we're working on
        const scopeManager = context.sourceCode.scopeManager;
        const innermostScope = getInnermostScope(
          scopeManager.globalScope,
          programNode,
        );

        // Try to get a GQL schema variable,
        // if there's not one theres nothing else to do.
        const graphQLSchemaVariable = getGQLVariable(innermostScope);
        if (!graphQLSchemaVariable) {
          return;
        }

        // Guard: The schema variable should be a valid GraphQL schema
        if (!isValidGraphQLSchema(graphQLSchemaVariable)) {
          context.report({
            node: graphQLSchemaVariable.defs[0].node,
            message: "Variable is not a valid GraphQL schema",
          });
          return;
        }

        // Parse the GraphQL Schema variable and extract the field types
        const gqlSchemaRaw =
          graphQLSchemaVariable.defs[0].node.init.quasi.quasis[0].value.raw;
        const gqlAST = parse(gqlSchemaRaw);

        // Guard: If no definitions in the GQL schema, nothing else to do.
        if (gqlAST.definitions.length === 0) {
          context.report({
            node: graphQLSchemaVariable.defs[0].node,
            message: "GraphQL schema should have at least one definition",
          });
          return;
        }

        // Get all the types and inputs in the GQL schema
        const gqlDefinitions = gqlAST.definitions.filter((definition) => {
          return (
            definition.kind === "ObjectTypeDefinition" || // Type keyword
            definition.kind === "InputObjectTypeDefinition" // Input keyword
          );
        });

        // Create a relation of GQL types to the fields it contains
        // This is a map of the form { typeName: [ { fieldName, type, nullable } ] }
        const gqlTypes = Object.fromEntries(
          gqlDefinitions.map((definition) => [
            definition.name.value,
            (definition.fields || []).map(getGqlFieldInfo),
          ]),
        );

        // Get all the Typescript interfaces in the file (and eventually types)
        const tsTypes = innermostScope.variables.filter((variable) => {
          return variable.defs[0].node.type === TS_INTERFACE_DECLARATION;
        });

        // Check all the ts types against the gql schema
        tsTypes.forEach((tsType) => {
          // Guard: If TS type name is not in the GQL schema, do nothing
          const tsTypeName = tsType.defs[0].node.id.name;
          if (!gqlTypes[tsTypeName]) {
            return;
          }

          // Compare the fields of the TS type and the GQL type
          const tsFields = tsType.defs[0].node.body.body.map(getTsFieldInfo);
          const gqlFields = gqlTypes[tsTypeName];
          compareFieldTypes(gqlFields, tsFields, tsType.defs[0].node, context);
        });
      },
    };
  },
});
