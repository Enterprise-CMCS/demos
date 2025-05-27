import { ESLintUtils } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator(name => name);

const noRelativeComponentImports = createRule({
  name: "no-relative-component-imports",
  meta: {
    docs: {
      description:
        "component imports should not be relative outside of test files",
    },
    messages: {
      noRelativeComponentImports: "Replace this relative import of "
       + "the components with an absolute import (start with components/)",
    },
    type: "suggestion",
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      ImportDeclaration(node) {
        const importPath = node.source.value;

        const isRelativeImport = /^(\.\/|\.\.\/)/.test(importPath);
        const isComponentImport = importPath.includes("components/");

        if (isRelativeImport && isComponentImport) {
          context.report({
            messageId: "noRelativeComponentImports",
            node: node.source,
          });
        }
      },
    };
  },
});

export default noRelativeComponentImports;
