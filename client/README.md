# Overview

The client application for the Demonstration Evaluation & Management Oversight System (DEMOS)

## Running the project

1. Install [node](https://nodejs.org/en/download) (version at least 22, LTS)
2. Run `npm install` to install required packages (found in `package.json`)
3. Run `npm run dev` to run the vite development server and navigate to http://localhost:3000 to see your locally running app! File modifications should automatically update in the browser on save.

## Federal Comment declaration release gate

`__FEATURE_DECLARE_FEDERAL_COMMENT_DATES_IN_PHASE_4__` in `vite.config.ts` and
`declareFederalCommentDatesInPhase4` in `../server/src/flags/getFeatureFlags.ts`
enable the new workflow at DEMOS version 1.3.0. Both remain disabled at 1.2.0;
development mode does not bypass this gate. Coordinate the client build version
with the server environment version in `../server/src/flags/currentDemosVersion.ts`.
Deploy the compatible API before enabling the client workflow.

When enabled, Completeness saves only its state-deemed-complete date. Federal
Comment starts with a blank picker for undeclared dates and saves the selected
start date with an end date 30 calendar days later. The start must be after the
state-deemed-complete date. Declaration is one-time, consistent with the server's
1.3.0 immutable-date rule; existing saved dates remain unchanged. The banner uses
the saved end date and Eastern calendar days, not an unsaved selection.

When disabled, Completeness continues calculating and saving the federal dates.
Do not roll back the gate after new-flow applications finish Completeness without
first reconciling applications missing federal dates: the legacy Phase 4 UI cannot
declare those dates. Tests cover both flag states using explicit overrides.
