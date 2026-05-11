import jsEslint from "@eslint/js";
import tseslint from "typescript-eslint";
import { validateGraphQLTypescriptMatch } from "./eslint-rules/validate-graphql-typescript-match.js";

const eslintConfig = tseslint.config(
  {
    ignores: ["**/dev/*", "**/dist/*", "tsconfig.json"],
  },
  jsEslint.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ["src/model/**/*.ts"], // Scope to model folder only
    plugins: {
      "validate-graphql-typescript-match": {
        rules: { "validate-graphql-typescript-match": validateGraphQLTypescriptMatch },
      },
    },
    rules: {
      "eol-last": ["error", "always"], // Newline at the end of files
      "no-restricted-exports": ["error", { restrictDefaultExports: { direct: true } }], // Disallow default exports
      "validate-graphql-typescript-match/validate-graphql-typescript-match": "error",
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-useless-escape": "off",
    },
  }
);

export default eslintConfig;
