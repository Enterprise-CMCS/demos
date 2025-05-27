import jsEslint from "@eslint/js";
import tseslint from "typescript-eslint";
import reactEslint from "eslint-plugin-react";
import noRelativeComponentImports from "./eslint-rules/no-relative-component-imports.js";

const IGNORED_FILES = [ "src/model/types.ts" ];

export default tseslint.config(
  jsEslint.configs.recommended,
  tseslint.configs.recommended,
  reactEslint.configs.flat.recommended,
  {
    ignores: IGNORED_FILES,
    plugins: {
      "no-relative-component-imports": {
        rules: { "no-relative-component-imports": noRelativeComponentImports },
      },
    },
    rules: {
      "indent": [ "error", 2 ], // 2 spaces for indentation
      "quotes": [ "error", "double" ], // Double quotes
      "semi": [ "error", "always" ], // Semicolons at end of statements
      "no-trailing-spaces": "error", // Disallow trailing spaces
      "no-tabs": "error", // Disallow tabs for indentation
      "eol-last": [ "error", "always" ], // Newline at the end of files
      // Trailing commas in multiline arrays and objects
      "comma-dangle": [ "error", { "arrays": "always-multiline", "objects": "always-multiline" } ],
      "object-curly-spacing": [ "error", "always" ], // Spaces inside object curly braces
      "no-relative-component-imports/no-relative-component-imports": "error", // Disallow relative imports of components
    },
  }
);
