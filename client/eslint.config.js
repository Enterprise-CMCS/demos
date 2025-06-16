import jsEslint from "@eslint/js";
import tseslint from "typescript-eslint";
import reactEslint from "eslint-plugin-react";
import prettierConfig from "eslint-config-prettier/flat";
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
      indent: ["error", 2], // 2 spaces for indentation
      quotes: ["error", "double"], // Double quotes
      semi: ["error", "always"], // Semicolons at end of statements
      "no-trailing-spaces": "error", // Disallow trailing spaces
      "no-tabs": "error", // Disallow tabs for indentation
      "eol-last": ["error", "always"], // Newline at the end of files
      // Trailing commas in multiline arrays, objects, imports, and exports
      "comma-dangle": [
        "error",
        {
          arrays: "always-multiline",
          objects: "always-multiline",
          imports: "always-multiline",
          exports: "always-multiline",
        },
      ],
      "no-restricted-exports": [
        "error",
        { restrictDefaultExports: { direct: true } },
      ], // Disallow default exports
      "no-relative-component-imports/no-relative-component-imports": "error", // Disallow relative imports of components
    },
  }
);

// eslint-disable-next-line no-restricted-exports
export default eslintConfig;
