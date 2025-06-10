import jsEslint from "@eslint/js";
import tseslint from "typescript-eslint";
import reactEslint from "eslint-plugin-react";
import prettierConfig from "eslint-config-prettier";
import { noRelativeComponentImports } from "./eslint-rules/no-relative-component-imports.js";

const eslintConfig = tseslint.config(
  jsEslint.configs.recommended,
  tseslint.configs.recommended,
  reactEslint.configs.flat.recommended,
  prettierConfig,
  {
    settings: {
      react: {
        version: "detect",
      },
    },
    plugins: {
      "no-relative-component-imports": {
        rules: { "no-relative-component-imports": noRelativeComponentImports },
      },
    },
    rules: {
      "no-restricted-exports": ["error", { "restrictDefaultExports": { "direct": true } }], // Disallow default exports
      "no-relative-component-imports/no-relative-component-imports": "error", // Disallow relative imports of components
    },
  }
);

// eslint-disable-next-line no-restricted-exports
export default eslintConfig;
