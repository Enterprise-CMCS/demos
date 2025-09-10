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
      // Prevent importing mocks in application code
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["mock-data", "mock-data/*", "faker_data", "faker_data/*"],
              message:
                "Do not import mock or faker data in app code. Use GraphQL queries or provide data via props."
            },
          ],
        },
      ],
    },
  },
  // Allow mocks in tests and the mocked apollo wrapper
  {
    files: [
      "src/**/*.test.{ts,tsx}",
      "src/**/*.spec.{ts,tsx}",
      "src/mock-data/**/*.{ts,tsx}",
      "src/router/MockedApolloWrapper.tsx",
    ],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "react/prop-types": "off",
    },
  },
];
