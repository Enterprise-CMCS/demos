# DEMOS Client Agent Guidelines

This file provides some helpful tips for AI agents to use when generating or editing code for the DEMOS client application

## TypeScript Conventions

- Declare module-level constants at the top of the file in `UPPER_SNAKE_CASE`.
- Use `camelCase` for function and variable names.
- Use `PascalCase` for Components, Classes, Types, and Interfaces.
- Prefer `const` over `let`; avoid `var`.

### On Types

- Type imports: If available, use server types from `demos-server` instead of re-declaring them locally. If needed Use `Pick<>` to narrow types to only the fields a component needs (though it can be reasonable to take in the more full object and only utilize needed fields).
- Prefer using sentinel values of the same type over type unions (even `?` which translates to `| undefined`). Example: if writing a function that takes a `string` type that may not be present use the empty string `""` to denote this absence rather than `undefined`.

## React Conventions

- Component files: Ideally one component per file; file name matches the component name (`DemonstrationDetail.tsx` exports `DemonstrationDetail`).
- Hook ordering: Declare hooks at the top of the component body in this order:
  1. Context hooks (`useAuth`, `useToast`, `getCurrentUser`, custom context)
  2. Router hooks (`useParams`, `useLocation`)
  3. Apollo hooks (`useQuery`, `useMutation`, `useLazyQuery`)
  4. `useState` declarations
- State: Keep state as close to where it is used as possible. Lift state only when necessary.
- Props interfaces: Do not export props interfaces unless they are shared. Prefer inlining non-exported prop interfaces to avoid drift in the file.
- CSS / Tailwind: Use the `tw` tag template helper from `tags/tw` for multi-class strings. This enables IDE Tailwind highlighting.

## Apollo / GraphQL

- Client setup: All GraphQL traffic goes through `DemosApolloProvider`. In production it attaches a Cognito `Authorization: Bearer <id_token>` header per request via `setContext`. Do not bypass this provider.
- Mocks in tests: In test mode the Apollo client is replaced by `MockedProvider`. Use `ALL_MOCKS` from `mock-data` (or pass a custom `mocks` array) via `TestProvider` from `test-utils/TestProvider`.
- Query / mutation naming: Co-locate the `gql` document with the component or hook that owns it, and export it so it can be referenced in mock data and `refetchQueries`.
- Mutations: After a successful mutation, pass the relevant query document to `refetchQueries` to keep the cache fresh instead of manually updating the cache.
- Error handling: Wrap `await mutationTrigger(...)` in `try/catch`. Check `result.errors` even on a non-throwing result. Show user feedback via `useToast` (`showSuccess` / `showError`).
- Date formatting: All dates sent to the server must use `formatDateForServer` (produces YYYY-MM-DD). All dates shown in the UI must use `formatDate` (produces MM/DD/YYYY). Both utilities are in `src/util/formatDate.ts`. Use `getTodayEst()` or `getDateEst()` when an Eastern-Time date is needed.
- Types from server: Import input/return types from `demos-server` (e.g., `CreateDemonstrationInput`, `Demonstration`, `PhaseName`). Do not redeclare them.

## Testing

- Test files should live alongside the file they test with the same name (e.g., `Foo.tsx` / `Foo.test.tsx`).
- Use `@testing-library/react` with `vitest`. Prefer `screen` queries; use `waitFor` if needed for async tests.
- Try to test real dependencies - this goes for things like dialogs. You can check that a `<dialog>` tag is in the DOM (bonus with the appropriate title). If needed and appropriate for the test scope mock dependencies with `vi.mock(...)`
- Use the `data-testid` attribute and `getByTestId` for selecting elements in tests. Ideally use an exported name or id type variable from the component.

## Files and Folders

Some of the most important folders in the project are below:

- `src/components/` - Shared, reusable UI components
- `src/pages/` - Route-level page components
- `src/router/` - Providers and top-level routing
- `src/layout/` - Layout components (providing a sidenav, etc)
- `src/mock-data/` - Apollo `MockedResponse` objects used in tests and local dev
