# Client Agent Guidelines

This file provides some helpful tips for AI agents to use when generating or editing code for the DEMOS client application

## TypeScript Conventions

- Constants: Declare module-level constants at the top of the file, in `SCREAMING_SNAKE_CASE`.
- Functions: Use `camelCase` for all function and variable names.
- Components / Classes / Types / Interfaces: Use `PascalCase`.
- Prefer `const` over `let`; avoid `var`.
- Type imports: Use server-generated types from `demos-server` instead of re-declaring them locally. Use `Pick<>` to narrow types to only the fields a component needs.

## React Conventions

- Component files: One component per file; file name matches the component name (`DemonstrationDetail.tsx` exports `DemonstrationDetail`).
- Functional components: Always type as `React.FC` or `React.FC<Props>`.
- Hook ordering: Declare hooks at the top of the component body in this order:
  1. Context hooks (`useAuth`, `useToast`, `getCurrentUser`, custom context)
  2. Router hooks (`useParams`, `useLocation`)
  3. Apollo hooks (`useQuery`, `useMutation`, `useLazyQuery`)
  4. `useState` declarations
  5. `useRef` declarations
  6. `useEffect` / `useMemo` / `useCallback`
- State: Keep state as close to where it is used as possible. Lift state only when necessary.
- Props interfaces: Define inline or as a named interface directly above the component. Do not export props interfaces unless they are shared.
- CSS / Tailwind: Use the `tw` tag template helper from `tags/tw` for multi-class strings. This enables IDE Tailwind highlighting.

## Server Interaction (Apollo / GraphQL)

- Client setup: All GraphQL traffic goes through `DemosApolloProvider`. In production it attaches a Cognito `Authorization: Bearer <id_token>` header per request via `setContext`. Do not bypass this provider.
- Endpoint: Configured via `VITE_API_URL_PREFIX` env variable (defaults to `/graphql`).
- Mocks in tests: In test mode the Apollo client is replaced by `MockedProvider`. Use `ALL_MOCKS` from `mock-data` (or pass a custom `mocks` array) via `TestProvider` from `test-utils/TestProvider`.
- Query / mutation naming: Co-locate the `gql` document with the component or hook that owns it, and export it so it can be referenced in mock data and `refetchQueries`.
- Fragments: Reusable field sets live in `src/fragments/` (e.g., `WORKFLOW_DOCUMENT_FIELDS`, `WORKFLOW_PHASE_FIELDS`). Spread them into queries and append at the bottom with `${FRAGMENT_NAME}`.
- Mutations: After a successful mutation, pass the relevant query document to `refetchQueries` to keep the cache fresh instead of manually updating the cache.
- Error handling: Wrap `await mutationTrigger(...)` in `try/catch`. Check `result.errors` even on a non-throwing result. Show user feedback via `useToast` (`showSuccess` / `showError`).
- Date formatting: All dates sent to the server must use `formatDateForServer` (produces YYYY-MM-DD). All dates shown in the UI must use `formatDate` (produces MM/DD/YYYY). Both utilities are in `src/util/formatDate.ts`. Use `getTodayEst()` or `getDateEst()` when an Eastern-Time date is needed.
- Types from server: Import input/return types from `demos-server` (e.g., `CreateDemonstrationInput`, `Demonstration`, `PhaseName`). Do not redeclare them.

## Auth

- Auth is handled by `react-oidc-context` (`useAuth`). The `DemosAuthProvider` wraps the entire app.
- Use `shouldUseMocks()` (from `config/env`) to branch between real Cognito auth and mock auth in local dev / test.
- The current logged-in user is available via `getCurrentUser()` (which reads from `UserContext`). Do not call `useAuth` directly in feature components.

## Testing

- Test files live alongside the file they test (e.g., `Foo.tsx` / `Foo.test.tsx`).
- Use `@testing-library/react` with `vitest`. Prefer `screen` queries; use `waitFor` for async state.
- Mock child components with `vi.mock(...)` when testing a parent in isolation.
- Use `data-testid` attributes for elements that are selected by tests; run `scripts/identify-missing-data-testid.py` to find gaps.

## File / Folder Structure

- `src/components/` — Shared, reusable UI components
- `src/pages/` — Route-level page components
- `src/hooks/` — Custom React hooks
- `src/fragments/` — Shared GraphQL fragments
- `src/mock-data/` — Apollo `MockedResponse` objects used in tests and local dev
- `src/util/` — Pure utility functions (date formatting, static messages)
- `src/config/env.ts` — Environment / mode helpers (`isLocalDevelopment`, `shouldUseMocks`)
- `src/test-utils/` — Shared test wrapper (`TestProvider`)
- `src/router/` — Providers and top-level routing
- `src/tags/` — Template-tag helpers (`tw`)
