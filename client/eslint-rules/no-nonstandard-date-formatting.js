import { ESLintUtils } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator((name) => name);

const DATE_METHODS = [
  "toLocaleDateString",
  "toLocaleString",
  "toISOString",
  "toUTCString",
  "toDateString",
  "toTimeString",
  "toJSON",
];

export const noNonstandardDateFormatting = createRule({
  name: "no-nonstandard-date-formatting",
  meta: {
    docs: {
      description: "Enforce usage of formatDate for formatting dates",
      category: "Best Practices",
    },
    messages: {
      useRenderDate: "Render dates using the RenderDate utility.",
    },
    type: "problem",
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    function isInsideRenderDateCall(node) {
      let parent = node.parent;
      while (parent) {
        if (
          parent.type === "CallExpression" &&
          parent.callee.type === "Identifier" &&
          parent.callee.name === "formatDate"
        ) {
          return true;
        }
        parent = parent.parent;
      }
      return false;
    }

    function shouldFlag(node) {
      return (
        (node.callee.type === "Identifier" && node.callee.name === "format") ||
        (node.callee.type === "MemberExpression" &&
          node.callee.property.type === "Identifier" &&
          DATE_METHODS.includes(node.callee.property.name))
      );
    }

    return {
      CallExpression(node) {
        if (shouldFlag(node)) {
          if (!isInsideRenderDateCall(node)) {
            context.report({ node, messageId: "useRenderDate" });
          }
        }
      },
    };
  },
});
