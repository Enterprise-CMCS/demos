# DEMOS Client Agent Guidelines

This file provides instructions for AI agents to use when generating or editing code for the DEMOS client application.

## Meta

- AI output should be understood and reviewed by the supervisor before being sent to the team for code-review.
- Keep verbiage in this file concise

## TypeScript

- Module-level constants: `UPPER_SNAKE_CASE` at top of file.
- Functions/variables: `camelCase`.
- Components/classes/types/interfaces: `PascalCase`.
- Prefer `const`; avoid `var`.

### Types

- Reuse shared types from `demos-server` when available; do not duplicate local copies.
- Use `Pick<>` or similar utility types when a component needs only part of a larger type.

### Functions

- Prefer writing functions that take sentinel values over optional / undefined. For instance `""` or `[]` can be the "base case" and used as "falsey"

## React

- Prefer one component per file; filename should match exported component name.
- Keep hooks at the top of the component body, in this order:
  1. Context hooks
  2. Router hooks
  3. State Hooks
  4. Apollo hooks
- Keep state close to where it is used; lift state only when needed.
- Do not export props interfaces unless shared across files. Prefer inlining props.

### Components

- Before using raw HTML controls, check `src/components/` and `src/layout/` for an existing wrapper.
- Prefer project components for inputs, buttons, tables, dialogs, tabs, and toast/notice feedback.

## Apollo / GraphQL

- Co-locate each `gql` document with the component/hook that owns it.
- Export query/mutation documents if tests, mocks, or `refetchQueries` need them.
- After successful mutations, refetch affected queries.
- All outbound dates must use `formatDateForServer` from `util/formatDate`.
- Inbound dates may need to use `getDateEst(date)`.

## Testing

- Place tests next to implementation (`Foo.tsx` and `Foo.test.tsx`).
- Use `@testing-library/react` with `vitest`; prefer `screen.getByTestId()` queries.
- Prefer real behavior over heavy mocking; use `vi.mock(...)` only at clear boundaries.

## Key Folders

- `src/components/`: shared UI components
- `src/pages/`: route-level pages
- `src/router/`: app-level providers and routing
- `src/layout/`: layout and navigation shells
- `src/mock-data/`: Apollo `MockedResponse` fixtures
