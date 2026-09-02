# DEMOS Client Agent Guidelines

This file provides instructions for AI agents to use when generating or editing code for the DEMOS client application.

## Meta

- AI output should be reviewed, understood, and approved by the supervisor.
- Keep verbiage in this file concise.
- This file should be read only once a the beginning of a session for context.

## TypeScript

- Module-level constants: `UPPER_SNAKE_CASE` at top of file.
- Functions/variables: `camelCase`.
- Components/classes/types/interfaces: `PascalCase`.
- Prefer `const`; avoid `var`.
- Prefer absolute imports using tsconfig paths over relative paths

### Types

- Reuse shared types from `demos-server` when available; do not duplicate local copies.
- Use `Pick<>` or similar utility types when a component needs only part of a larger type.
- Prefer `Pick` over `Omit` for type derivations.

### Functions

- Prefer writing functions that take sentinel values over optional / undefined. Very commonly `""` or `[]` can be the "base case" and used as "falsey" instead of a type union with null or undefined.
- Prefer to fail-fast over delaying error handling. Use guard clauses in functions with preconditions fot this.

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
- Prefer spacing elements using `gap` rather than `margin`.
- Prefer creating sub components that take props over sub-components in scope of the main component
- In sub-components, do not pass a prop if the value can be fetched through a hook

### Components

- Before using raw HTML controls, check `src/components/` and `src/layout/` for an existing wrapper.
- Prefer project components for inputs, buttons, tables, dialogs, tabs, and toast/notice feedback.

#### DatePicker / Dates

- DatePickers propagate valid values (yyyy-mm-dd) back to calling components `onChange` handler.
- Computed dates receive values via the `value` prop and display this.
- Out-of-range inputs are displayed and flagged but not propagated.
- If needed, refer to the `src/util/formatDates.ts` for considerations on date utility functions.

## Apollo / GraphQL

- Co-locate each `gql` document with the component/hook that owns it.
- Export query/mutation documents if tests, mocks, or `refetchQueries` need them.
- After successful mutations, refetch affected queries.

## Testing

### Unit Testing

- Place tests next to implementation (`Foo.tsx` and `Foo.test.tsx`).
- Use `@testing-library/react` with `vitest`; prefer `screen.getByTestId()` queries.
- Often times `name` attributes are propagated to `data-test-id`, try this approach first.
- Prefer real behavior over heavy mocking; use `vi.mock(...)` only at clear boundaries.
- Run tests with `npm run test:once ...`
- Use <TestProvider> as needed to provide dependencies such as toasts, auth, routing, etc.
- Prefer to not mock <DialogProvider>. Also <TestProvider> does not provide dialogs and they should be provided inside of <TestProvider> if needed.
- Generally, avoid firing manual focus / blur events in tests

### Mock Data

- Mock data can be found in the `mock-data` directory. Tests should try to use mocks from these locations in order to keep clean test files for needed data.
- Mocks should not define a new type that is a subset of the server side type but rather aim to meet the mock needs fully (utilizing mock data from other models to fill in the gaps and providing empty values otherwise)
- Where volume is needed in testing, mocks should not be created with random, plausible looking data but rather the same mock or small set of mocks should be repeated.
- In most cases individual entities should be exported from mock data files rather than whole lists. If lists are needed they should be made out of individiaul entities, with few exceptions like `State`.
- Sometimes circular dependencies will need to be avoided, when this is the case you can do `{} as ServerType` in order to not re-use an existing entity. The F/E can make decisions about the directionality of data that it fetches.

### General Testing

- Run linting + typechecking with `npm run lint`
- For testing behavior with different roles you can use the different variants of `npm run dev:mocks` - `dev:mocks:admin`, `dev:mocks:state`, etc. Some functionality is only available through certain roles.
- For testing an unauthenticated user: `npm run dev:mocks:unauth`

### Accessibility Testing

- For testing focus changing throught the application add this temporary rule to `index.css`: `*:focus { outline: 3px solid red !important; }`

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

## DEMOS Features

This section contains guidance related to working on specific features in DEMOS

### Application Workflow

The application workflow is an important part of the overall DEMOS workflow, containing 8 phases that users collaboratively go through in order to approve an application (which is a demonstration, amendment, or extension). A mapping from phase numbers to names is below:

1. Concept
2. Application Intake
3. Completeness
4. Federal Comment
5. SDG Preparation
6. Review
7. Approval Package
8. Approval Summary

## Future Refactors

- usePhaseStatus hook: currently phase status needs to be plumbed through to a lot of different areas which can be obviated by providing phase status in a context wrapping the application workflow. This can also include `setCurrentPhase` which will allow us to navigate to a specific phase (for instance the next phase) without propagating this prop through a number of levels.
- mockData Cleanup: Currently we have a lot of mock data that is breaking the rules of mocks, defining types which requires a separate surface area to maintain (MockUser, MockPerson, MockState, etc vs just User, Person, State). We should address this and remove these specialized types.
