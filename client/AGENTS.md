# DEMOS Client Agent Guidelines

This file provides instructions for AI agents to use when generating or editing code for the DEMOS client application.

## Meta

- AI output should be reviewed, understood, and approved by the supervisor.
- Keep verbiage in this file concise.

## TypeScript

- Module-level constants: `UPPER_SNAKE_CASE` at top of file.
- Functions/variables: `camelCase`.
- Components/classes/types/interfaces: `PascalCase`.
- Prefer `const`; avoid `var`.
- Prefer absolute imports using the tsconfig paths

### Types

- Reuse shared types from `demos-server` when available; do not duplicate local copies.
- Use `Pick<>` or similar utility types when a component needs only part of a larger type.
- Prefer `Pick` over `Omit` for type derivations.

### Functions

- Prefer writing functions that take sentinel values over optional / undefined. For instance `""` or `[]` can be the "base case" and used as "falsey"
- Prefer to fail-fast over delaying error handling. Use guard clauses as needed.

## React

- Prefer one component per file; filename should match exported component name.
- Keep hooks at the top of the component body, in this order:
  1. Context hooks
  2. Router hooks
  3. State Hooks
  4. Apollo hooks
- Keep state close to where it is used; lift state only when needed.
- Do not export props interfaces unless shared across files. Prefer inlining props.
- Generally, prefer required props. Optional props are okay iff updating calls to an existing component would be a heavy lift.

## CSS

- Prefer using `gap` in a parent tag over `margin` in a child tag.

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
- Often times `name` attributes are propagated to `data-test-id`, try this approach first.
- Prefer real behavior over heavy mocking; use `vi.mock(...)` only at clear boundaries.
- Run tests with `npm run test:once ...`
- Prefer to keep mock data in test files for clarity / isolation rather than in `/mock-data`.
- For testing behavior with different roles you can use the different variants of `npm run dev:mocks`

### Mocking Mutations

For test files that don't care about testing mutations you can use this code to mock it.

```
const mockMutate = vi.fn(() => Promise.resolve({ data: {} }));
vi.mock("@apollo/client", async () => {
  const actual = await vi.importActual("@apollo/client");
  return {
    ...actual,
    useMutation: vi.fn(() => [mockMutate, { loading: false }]),
  };
});
```

## Key Folders

- `src/components/`: shared UI components
- `src/pages/`: route-level pages
- `src/router/`: app-level providers and routing
- `src/layout/`: layout and navigation shells
- `src/mock-data/`: Apollo `MockedResponse` fixtures
