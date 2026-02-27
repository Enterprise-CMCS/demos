import {
  mapSchema,
  MapperKind,
  getDirectives,
  DirectiveAnnotation,
  FieldMapper,
} from "@graphql-tools/utils";
import { defaultFieldResolver, GraphQLSchema } from "graphql";
import { cmsOnlyDirective } from "./cmsOnlyDirective";

export type FieldResolver = Parameters<FieldMapper>[0]["resolve"];

export type DirectiveHandler = (
  resolve: NonNullable<FieldResolver>,
  directive?: DirectiveAnnotation
) => FieldResolver;

const DIRECTIVE_MAP: Record<string, DirectiveHandler> = {
  [cmsOnlyDirective.name]: cmsOnlyDirective.handler,
};

export function directiveTransformer(schema: GraphQLSchema) {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const directives = getDirectives(schema, fieldConfig);
      for (const directive of directives) {
        const interceptor = DIRECTIVE_MAP[directive.name];
        if (interceptor) {
          fieldConfig.resolve = interceptor(fieldConfig.resolve || defaultFieldResolver, directive);
        }
      }
      return fieldConfig;
    },
    [MapperKind.OBJECT_TYPE]: (typeConfig) => {
      const directives = getDirectives(schema, typeConfig);
      for (const directive of directives) {
        const fields = typeConfig.getFields();
        for (const fieldConfig of Object.values(fields)) {
          const interceptor = DIRECTIVE_MAP[directive.name];
          if (interceptor) {
            fieldConfig.resolve = interceptor(
              fieldConfig.resolve || defaultFieldResolver,
              directive
            );
          }
        }
        return typeConfig;
      }
    },
  });
}
