import jsEslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import validateGraphQLTypescriptMatch from './eslint-rules/validate-graphql-typescript-match.js';

const IGNORED_FILES = ["src/model/types.ts"];

export default tseslint.config(
  jsEslint.configs.recommended,
  tseslint.configs.recommended,
  {
    ignores: IGNORED_FILES,
    plugins: {
      "validate-graphql-typescript-match": {
        rules: { "validate-graphql-typescript-match": validateGraphQLTypescriptMatch },
      },
    },
    rules: {
      "eol-last": ["error", "always"], // Newline at the end of files
      "validate-graphql-typescript-match/validate-graphql-typescript-match": "error",
    }
  },
);
