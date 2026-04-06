# DEMOS Client Agent Guidelines

This file provides some helpful tips for AI agents to use when generating or editing code for the DEMOS client application

## TypeScript Conventions

- Declare module-level constants at the top of the file in `UPPER_SNAKE_CASE`.
- Use `camelCase` for function and variable names.
- Use `PascalCase` for Components, Classes, Types, and Interfaces.
- Prefer `const` over `let`; avoid `var`.

### On Types

- Type imports: If available, use server types from `demos-server` instead of re-declaring them locally. If needed Use `Pick<>` to narrow types to only the fields a component needs (though it can be reasonable to take in the more full object and only utilize needed fields through dot-access).
- Prefer using sentinel values of the same type over type unions (even `?` which translates to `| undefined`). Example: if writing a function that takes a `string` type that may not be present use the empty string `""` to denote this absence rather than `undefined`.
- Similar to the above, if a function might be able to take a list, then

## React Conventions

- Component files: Ideally one component per file; file name matches the component name (`DemonstrationDetail.tsx` exports `DemonstrationDetail`).
- Hook ordering: Declare hooks at the top of the component body in this order:
  1. Context hooks (`useAuth`, `useToast`, `getCurrentUser`, custom context)
  2. Router hooks (`useParams`, `useLocation`)
  3. `useState` hooks
  4. Apollo hooks (`useQuery`, `useMutation`, `useLazyQuery`)
- State: Keep state as close to where it is used as possible. Lift state only when necessary.
- Props interfaces: Do not export props interfaces unless they are shared. Prefer inlining non-exported prop interfaces to avoid drift between the interface and the component.
- CSS / Tailwind: Use the `tw` tag template helper from `tags/tw` for multi-class strings. This enables IDE Tailwind highlighting.

### Components

There are many pre-built components in the app that wrap base HTML components to provide styling and functionality. When asked to add a component to the app, prefer one of these over a raw HTML element when possible. A non-exhaustive list:

- Inputs: `Input`, `TextInput`, `Textarea`, `Checkbox`, `DatePicker`, `Select`, `AutoCompleteSelect`, `AutoCompleteMultiselect`, `RadioGroup`, `CheckboxGroup`
- Buttons: `Button`, `SecondaryButton`, `TertiaryButton`, `WarningButton`, `ErrorButton`, `IconButton`, `CircleButton`, `ButtonGrid`
- Tables and filtering: `Table`, `KeywordSearch`, `ColumnFilter`, `PaginationControls`, `TabHeader`
- Dialogs: `BaseDialog` and `useDialog`, plus existing concrete dialogs like `CreateDemonstrationDialog`, `CreateAmendmentDialog`, `CreateExtensionDialog`, `AddDocumentDialog`
- Tabs: `Tabs`, `VerticalTabs`, `HorizontalSectionTabs`
- Feedback: `Notice`, `useToast` (`showSuccess` / `showError`), `InfoToast`, `SuccessToast`, `WarningToast`, `ErrorToast`, `ConfirmationToast`
- Status and tags: `ApplicationStatusBadge`, `CompletenessBadge`, `TagChip`, `ApplicationHealthTypeTags`
- Utility layout: `Collapsible`, `Loading`, `Header`, `Footer`

## Apollo / GraphQL

- Query / mutation naming: Co-locate the `gql` document with the component or hook that owns it, and export it so it can be referenced in mock data and `refetchQueries`.
- Mutations: After a successful mutation, look to pass the relevant query document to `refetchQueries` to ensure that views are updated. If it's not clear what views need to be updated call this out to the user.
- Date formatting: All dates sent to the server must use `formatDateForServer` (produces YYYY-MM-DD). Dates coming from the server will be in UTC and generally should be stored in EST. To do this

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
