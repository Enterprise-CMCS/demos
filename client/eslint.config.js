import prettierConfig from "eslint-config-prettier/flat";
import reactPlugin from "eslint-plugin-react";
import tseslint from "typescript-eslint";

import js from "@eslint/js";

import { noRelativeComponentImports } from "./eslint-rules/no-relative-component-imports.js";
import { noNonstandardDateFormatting } from "./eslint-rules/no-nonstandard-date-formatting.js";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactPlugin.configs.flat.recommended,
  prettierConfig,

  {
    files: ["src/**/*.{js,ts,jsx,tsx}"],
    settings: {
      react: {
        version: "detect",
      },
    },
    plugins: {
      "no-relative-component-imports": {
        rules: {
          "no-relative-component-imports": noRelativeComponentImports,
        },
      },
      "no-nonstandard-date-formatting": {
        rules: {
          "no-nonstandard-date-formatting": noNonstandardDateFormatting,
        },
      },
    },
    rules: {
      indent: ["error", 2, { SwitchCase: 1 }],
      quotes: ["error", "double", { avoidEscape: true }],
      semi: ["error", "always"],
      "no-trailing-spaces": "error",
      "no-tabs": "error",
      "eol-last": ["error", "always"],
      "comma-dangle": [
        "error",
        {
          arrays: "always-multiline",
          objects: "always-multiline",
          imports: "always-multiline",
          exports: "always-multiline",
        },
      ],
      "no-restricted-exports": ["error", { restrictDefaultExports: { direct: true } }],
      "no-relative-component-imports/no-relative-component-imports": "error",
      "no-nonstandard-date-formatting/no-nonstandard-date-formatting": "error",
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "react/prop-types": "off",
    },
  },
];
