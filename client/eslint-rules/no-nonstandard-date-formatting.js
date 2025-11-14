import { ESLintUtils } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator((name) => name);

const DISALLOWED_DATE_METHODS = [
  "toLocaleDateString",
  "toLocaleString",
  "toISOString",
  "toUTCString",
  "toDateString",
  "toTimeString",
  "toJSON",
  "setDate",
];

export const noNonstandardDateFormatting = createRule({
  name: "no-nonstandard-date-formatting",
  meta: {
    docs: {
      description: "Enforce usage of date-fns for formatting and parsing dates",
      category: "Best Practices",
    },
    messages: {
      no_date_methods: "This method on the date object is not allowed. Use date-fns instead.",
    },
    type: "problem",
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    function shouldFlag(node) {
      return (
        node.callee.type === "MemberExpression" &&
        node.callee.property.type === "Identifier" &&
        DISALLOWED_DATE_METHODS.includes(node.callee.property.name)
      );
    }

    return {
      CallExpression(node) {
        if (shouldFlag(node)) {
          context.report({ node, messageId: "no_date_methods" });
        }
      },
    };
  },
});
