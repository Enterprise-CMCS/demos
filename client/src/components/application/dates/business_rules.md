# Bundle Date Business Rules

Bundle dates are stored at the bundle level (demonstration/amendment/extension) and are not nested within phases. Each date is directly associated with a bundle via `bundleId` and has a specific `dateType`.

## Date Types by Phase

### 1. Concept Phase

- **Concept Start Date** - Begins when the demonstration, amendment or extension is created.
- **Pre-Submission Submitted Date** - Optional date when pre-submission materials are submitted.
- **Concept Completion Date** - When user clicks the Finish or skip button.

Note: If the user doesn't "click" skip and goes to the next phase, this will be marked completed when the user clicks Finish on the State Application Phase.

### 2. State Application Phase

- **State Application Start Date** - Can start in one of two ways, whichever comes first:
  - a. User clicked Skip or Finish on the Concept Phase
  - b. When a change is submitted on this phase - document or date update.

- **State Application Submitted Date** - When the state formally submits their application.

- **State Application Completion Date** - Completed when user clicks "Finish" to progress to the next phase.

Note: If the user skips the concept phase this will be marked completed when the user clicks Finish on the State Application Phase.

### 3. Completeness Phase

- **Completeness Start Date** - As soon as the "State Application Submitted Date" is populated. Can also start when a change is submitted on this phase - document or date update. Start date is set to whichever of the dates above is first.

- **Completeness Review Due Date** - Optional date when completeness review is due.

- **Completeness Completion Date** - Completed when user clicks "Finish" to progress to the next phase.

## Implementation Notes

While bundle dates are stored at the bundle level, the GraphQL API provides a convenience method `getBundleDatesForPhase(bundleId, phaseId)` that filters bundle dates to only those associated with a specific phase (via the `phase_date_type` join table).

In the frontend, work with bundle dates directly as a flat array rather than nested within phase objects. Use helper functions like `getDateFromBundleDates()`, `setDateInBundleDates()`, and `getDatesByPrefix()` to manage dates.
