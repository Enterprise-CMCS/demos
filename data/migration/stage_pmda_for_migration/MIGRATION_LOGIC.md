# Migration Logic Documentation

This file contains documentation of migration logic decisions that were made.

# Users

- Initial user filtering used `legacy_pmda_raw.users.active = 1`
- Users were filtered out if their email was null, empty string, or failed the regex `^[A-Za-z0-9._+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$`
- Users were filtered out if their first name or last name were null or empty string
- Users were filtered out if their PMDA user roles (`legacy_pmda_raw.user_role_asgnmt`) could not be mapped to a DEMOS `person_type_id`
  - This would occur if there were no roles assigned in PMDA
- If a PMDA user's roles would resolve to multiple DEMOS `person_type_id` records, the **_HIGHEST_** `person_type_id` was selected

# Applications

## Demonstrations

### Clearance Level

PMDA does not have a direct analogue to DEMOS for `clearance_level_id`. The default in DEMOS is `CMS (OSORA)`, which is what is used when migrating demonstrations from PMDA. Users may need to update this later.

### Medicaid and CHIP ID Numbers

#### Format

The formatting of Medicaid / CHIP ID numbers in PMDA was inconsistent, so it was necessary to standardize them. Medicaid IDs and CHIP IDs were drawn from:

- `legacy_pmda_raw.mdcd_demo.mdcd_demo_num`
- `legacy_pmda_raw.mdcd_demo.mdcd_scndry_demo_num`
- `legacy_pmda_raw.mdcd_pendg_demo.mdcd_demo_num`

In cases where `mdcd_scndry_demo_num` is discussed,that logic is only applied to "finalized" demonstrations from PMDA, as those in the pending table do not have the `mdcd_scndry_demo_num` to evaluate.

The validation considers two aspects: the format of the number, and its location (for `legacy_pmda_raw.mdcd_demo`).

- A valid format number is one that passes the regex `^(11|21)-W-[0-9]{5}/([1-9]|10)$`
- The location is valid if the format is valid, and it is in the right field (Medicaid ID in `mdcd_demo_num`, CHIP ID in `mdcd_scndry_demo_num`).

The specific steps are listed below.

- Any numbers that passed the regex `^(11|21)-W-[0-9]{5}/([1-9]|10)$` before standardization weren't changed.
- Next, all `-`, `/`, and whitespace characters were removed from each ID, resulting in a stripped number.
- Stripped numbers were flagged as invalid for the following reasons:
  - If the number was NULL
    - Note: since CHIP IDs are not required, `NULL` was considered valid in the `mdcd_scndry_demo_num` field
  - If it was an empty string
    - Note: since CHIP IDs are not required, empty string was considered valid in the `mdcd_scndry_demo_num` field
  - If the length was not 9 or 10 characters
    - With stripping, there should always be either 9 or 10 total characters
  - If the 3rd character was not W
  - If the length was 10 and the last two characters are not `10` (region 10)
    - Because the region is not zero-padded, the length will only be 10 when in the two-digit region 10
  - If the length was 9 and the last two characters are not in the set `[1, 9]` (regions 1 - 9)
  - If the first two characters were not 21 (possibly a valid CHIP ID) or 11 (possibly a valid Medicaid ID)
- The stripped number was formatted back into the standard format, and then passed through the regex again to make sure it was either a valid Medicaid ID or CHIP ID after reassembly.
- The resulting records were either valid format Medicaid IDs or valid format CHIP IDs.
  - If a valid format CHIP ID was in the `mdcd_demo_num` or vice versa, the location was considered invalid.

To be migrated, the demonstration had to have a valid format and location for both `mdcd_demo_num` and `mdcd_scndry_demo_num`.

Demonstrations were filtered to cases where the format and location of both numbers are valid, which includes:

- A valid Medicaid ID in the `mdcd_demo_num` field and a valid CHIP ID in the `mdcd_scndry_demo_num` field
- A valid Medicaid ID in the `mdcd_demo_num` field and a missing value in the `mdcd_scndry_demo_num` field

#### Duplicates

In the rare case where a `mdcd_demo_num` existed more than once after being properly sanitized, those demonstrations were omitted from the migration.

### Primary Project Officer

Demonstrations in DEMOS are required to have a primary Project Officer. In cases where `legacy_pmda_raw.mdcd_demo.proj_ofcr_user_id` is `NULL` or cannot be resolved to a user, the user Elizabeth Hill was assigned as the primary Project Officer.

### Demonstration Type

Approved demonstrations in DEMOS are required to have at least one demonstration type. To ensure that this constraint was met, a demonstration type called `Migrated From PMDA` was added, and assigned to all the "finalized" demonstrations that were migrated.

### Phases and Dates for Finalized Demonstrations

The date data available from PMDA is sparse relative to the requirements of DEMOS. Since "finalized" or approved demonstrations do not need to move through the application process, these were migrated with no values populated into `demos_app.application_date`. All eight phases in `application_phase` were set to `Completed`.

### Phases and Dates for In Progress Demonstrations

Similar to finalized demonstrations, the date data from PMDA is sparse; however because the requirements on completion are less applicable, inferences can be made about the dates to fill in gaps.

#### Data Quality and Filtering

In-progress demonstrations are filtered at multiple stages to ensure data quality:

1. **Invalid Medicaid/CHIP ID Numbers**: Demonstrations with invalid format or location errors are excluded via `errors_invalid_demo_nums_in_in_prog_pmda_demos`
2. **Missing Application ID**: Demonstrations where `mdcd_demo_aplctn_id` is NULL are excluded via `errors_apps_in_prog_missing_aplctn`
3. **Missing Phase Completion Data**: Demonstrations that cannot be joined to phase completion data are excluded via `errors_apps_in_prog_demos_missing_phase_completion` (expected to be zero records as both models derive from the same source)
4. **Invalid Dates**: Individual dates that fail validation (temporal inconsistencies, missing required dependencies) are set to NULL and tracked in `errors_apps_in_prog_dates_failing_validation`

The date validation process includes:

- **Temporal Consistency**: Dates must follow logical time sequences (e.g., start dates before end dates, completion dates after start dates)
- **Required Dependencies**: Certain dates require other dates to exist (e.g., completion dates require corresponding start dates)
- **Two-Stage Validation**: Primary validations check temporal relationships, then completion dates validate against both raw dates AND validation flags to avoid circular dependencies

Dates that fail validation are set to NULL in the `cleaned_` columns, allowing demonstrations to proceed through migration with partial date information rather than being entirely excluded.

#### Date Timestamp Conventions

All dates use consistent timestamp conventions:

- **Start of Day**: Most dates use `00:00:00.000` (midnight at the start of the day)
- **End of Day**: The following dates use `23:59:59.999` (final millisecond of the day):
  - Completeness Review Due Date
  - Federal Comment Period End Date
  - CMS (OSORA) Clearance End

All timestamps are converted to `America/New_York` timezone during migration.

#### Date Type Derivations

##### Concept Phase

- **Concept Start Date**: Directly mapped from PMDA `phase_1_strt_dt`, with fallback to application created date (`creatd_dt`) converted to Eastern date when `phase_1_strt_dt` is NULL
- **Concept Paper Submitted Date**: ❌ Excluded - No equivalent field in PMDA (may be derived later from document metadata if available)
- **Concept Completion Date**: Directly mapped from PMDA `phase_1_end_dt`. Must be mutually exclusive to Concept Skipped Date.
- **Concept Skipped Date**: Conditionally derived as one day before State Application Submitted Date **only when** `phase_1_end_dt` is NULL AND `phase_2_rcvd_dt` is NOT NULL (indicates the concept phase was skipped). Must be mutually exclusive to Concept Completion Date.

##### Application Intake Phase

- **Application Intake Start Date**:
  - **Primary Derivation**: One day before State Application Submitted Date when available
  - **Fallback Derivation**: Application created date (`creatd_dt`) when primary derivation is not available but the phase has other dates
  - **Otherwise**: NULL
- **State Application Submitted Date**: Directly mapped from PMDA `phase_2_rcvd_dt`
- **Completeness Review Due Date**: Directly mapped from PMDA `phase_2_cmpltns_rvw_dt` (End of Day timestamp: 23:59:59.999)
- **Application Intake Completion Date**: Directly mapped from PMDA `phase_2_cmpltns_rvw_dt` (same source as Completeness Review Due Date, Start of Day timestamp)

##### Completeness Phase

- **Completeness Start Date**:
  - **Primary Derivation**: One day after Completeness Review Due Date when available
  - **Fallback Derivation**: Application created date (`creatd_dt`) when primary derivation is not available but the phase has other dates
  - **Otherwise**: NULL
- **State Application Deemed Complete**: Directly mapped from PMDA `phase_2_state_aplctn_deemd_cmpltn_dt`
- **Federal Comment Period Start Date**: Directly mapped from PMDA `phase_2_fed_cmt_prd_strt_dt`
- **Federal Comment Period End Date**: Directly mapped from PMDA `phase_2_fed_cmt_prd_end_dt` (End of Day timestamp: 23:59:59.999)
- **Completeness Completion Date**: Conditionally derived as one day before Federal Comment Period Start Date **only when** `phase_2_fed_cmt_prd_strt_dt` is NOT NULL

##### SDG Preparation Phase

- **SDG Preparation Start Date**:
  - **Primary Derivation**: One day after Federal Comment Period End Date when available
  - **Fallback Derivation**: Application created date (`creatd_dt`) when primary derivation is not available but the phase has other dates
  - **Otherwise**: NULL
- **Expected Approval Date**: Directly mapped from PMDA `phase_2_dsrd_aprvl_dt`
- **SME Initial Review Date**: Directly mapped from PMDA `phase_3_a_sme_strt_dt`
- **FRT Initial Meeting Date**: Directly mapped from PMDA `phase_3_a_frvt_strt_dt`
- **BNPMT Initial Meeting Date**: ❌ Excluded - No equivalent field in PMDA
- **SDG Preparation Completion Date**: Conditionally derived as the later (GREATEST) of SME Initial Review Date or FRT Initial Meeting Date **only when** at least one of these dates is NOT NULL

##### Review Phase

- **Review Start Date**:
  - **Primary Derivation**: Earliest (LEAST) of Receive OGC Legal Clearance, Receive OMB Concurrence, or Submit Approval Package to OSORA when at least one is available
  - **Fallback Derivation**: Application created date (`creatd_dt`) when primary derivation is not available but the phase has other dates
  - **Otherwise**: NULL
- **OGD Approval to Share with SMEs**: ❌ Excluded - No equivalent field in PMDA
- **Draft Approval Package to Prep**: ❌ Excluded - No equivalent field in PMDA
- **DDME Approval Received**: ❌ Excluded - No equivalent field in PMDA
- **State Concurrence**: ❌ Excluded - No equivalent field in PMDA
- **BN PMT Approval to Send to OMB**: ❌ Excluded - No equivalent field in PMDA
- **Draft Approval Package Shared**: ❌ Excluded - No equivalent field in PMDA
- **Receive OGC Legal Clearance**: Directly mapped from PMDA `phase_3_c_ogc_strt_dt`
- **Receive OMB Concurrence**: Directly mapped from PMDA `phase_3_c_omb_strt_dt`
- **Submit Approval Package to OSORA**: Directly mapped from PMDA `phase_5_strt_dt`
- **OSORA R1 Comments Due**: ❌ Excluded - No equivalent field in PMDA
- **OSORA R2 Comments Due**: ❌ Excluded - No equivalent field in PMDA
- **CMS (OSORA) Clearance End**: Directly mapped from PMDA `phase_5_end_dt` (End of Day timestamp: 23:59:59.999)
- **Package Sent for COMMs Clearance**: Directly mapped from PMDA `phase_6_strt_dt`
- **COMMs Clearance Received**: Directly mapped from PMDA `phase_6_end_dt`
- **Review Completion Date**: Conditionally derived as the later (GREATEST) of CMS (OSORA) Clearance End or COMMs Clearance Received dates **only when** at least one of these dates is NOT NULL

##### Approval Package Phase

- **Approval Package Start Date**: Directly mapped from PMDA `phase_4_strt_dt`
- **Approval Package Completion Date**: Directly mapped from PMDA `phase_4_end_dt`

##### Approval Summary Phase

This phase is assumed to be skipped for in-progress demonstrations migrated from PMDA:

- **Application Details Marked Complete Date**: ❌ Excluded - No equivalent field in PMDA
- **Application Demonstration Types Marked Complete Date**: ❌ Excluded - No equivalent field in PMDA
- **Approval Summary Start Date**: ❌ Excluded - No equivalent field in PMDA
- **Approval Summary Completion Date**: ❌ Excluded - No equivalent field in PMDA

##### Final Approval

- **Application Approval Date**: ❌ Excluded - By definition, in-progress demonstrations are not yet approved

#### Current Phase and Phase Status Derivations

For each in-progress application, a phase status is determined for all eight phases based on the presence of specific completion dates.

##### Phase Status Values

The possible phase status values are:

- **Not Started**: The phase has not begun (start date does not exist)
- **Started**: The phase has begun (start date exists) but completion date does not exist
- **Completed**: The phase is fully complete (completion date exists)
- **Skipped**: Only applicable to the Concept phase when it was bypassed

##### Phase-Specific Status Logic

Each phase's status is determined independently based on the cleaned (validated) dates:

###### Concept Phase

The Concept phase is always at least "Started" (since all in-progress demos must have begun). Its status is determined as:

- **Completed**: If `cleaned_concept_completion_date` is NOT NULL
- **Skipped**: If `cleaned_concept_skipped_date` is NOT NULL
- **Started**: Otherwise (default)

###### Application Intake Phase

- **Completed**: If `cleaned_application_intake_completion_date` is NOT NULL
- **Started**: If `cleaned_application_intake_start_date` is NOT NULL
- **Not Started**: Otherwise

###### Completeness Phase

- **Completed**: If `cleaned_completeness_completion_date` is NOT NULL
- **Started**: If `cleaned_completeness_start_date` is NOT NULL
- **Not Started**: Otherwise

###### Federal Comment Period

This is tracked as a separate status (though it overlaps with Completeness phase). The migration logic hardcodes this status to **'Not Started'** and relies on the stored procedure `update_federal_comment_phase_status()` to calculate the actual status based on date ranges after migration completes.

- **During Migration**: Always set to 'Not Started'
- **Post-Migration**: Status set to 'Completed' by `demos_app.update_federal_comment_phase_status()` stored procedure (runs via cron schedule) when Federal Comment Period dates exist, because all Federal Comment Period dates in PMDA are historical (already ended)
- **Never 'Started'**: This phase is never in 'Started' status because migrated data is never within an active comment period

###### SDG Preparation Phase

- **Started**: If `cleaned_sdg_preparation_start_date` is NOT NULL
- **Not Started**: Otherwise

Note: This phase cannot reach "Completed" status requisite dates do not have a valid mapping

###### Review Phase

- **Started**: If `cleaned_review_start_date` is NOT NULL
- **Not Started**: Otherwise

Note: This phase cannot reach "Completed" status requisite dates do not have a valid mapping

###### Approval Package Phase

- **Started**: If `cleaned_approval_package_start_date` is NOT NULL
- **Not Started**: Otherwise

Note: This phase cannot reach "Completed" status requisite dates do not have a valid mapping

###### Approval Summary Phase

This phase is always set to **"Not Started"** for all in-progress demonstrations migrated from PMDA, as none of the required dates exist in the source system.

##### Current Phase Determination

The current phase is determined by evaluating phase statuses in order and selecting the **first phase that has not yet been completed**. The logic explicitly checks for incomplete statuses:

1. **Concept**: Current if the phase status is 'Started' AND Application Intake phase status is 'Not Started'
2. **Application Intake**: Current if the phase status is 'Not Started' OR 'Started'
3. **Completeness**: Current if the phase status is 'Not Started' OR 'Started'
4. **SDG Preparation**: Default for all other cases (when Completeness is completed)

**Note on Federal Comment Period:** The Federal Comment Period is not evaluated in current_phase_id logic because migrated data is never within an active comment period. When Federal Comment Period dates exist in PMDA, they represent periods that have already ended, so the phase is always completed (never current).

**Phase Progression Limit:**
The current phase logic does not evaluate beyond SDG Preparation phase as requisite dates for completing the SDG Preparation phase do not exist in PMDA, so demonstrations cannot have progressed further than that phase.

# Deliverables

## Status Code

There is a status code in PMDA that is just labeled 'N/A'. It appears on two non-deleted deliverables. These were filtered out of the migration. Deleted deliverables were also filtered out.

In PMDA, a status code of 16 indicated Pending Due Date Changed. There are a small number of non-deleted deliverables with this status. For now, these are just being filtered out. `#open-question`

The "Past Due" status from PMDA was not migrated at all. Instead, things which were marked Past Due were migrated as Upcoming. Then, the stored procedure which marks things past due was triggered. This ensures that all the Past Due items marked in DEMOS are marked as such based on the DEMOS logic.

There are some unusual records right now for this; additional information from PMDA has been added into the staging tables so that it's possible to debug some of this. Things like resubmissions being requested aren't currently represented in the activity log, meaning that we get records that look like something is Past Due when it was submitted, with no other rows. We'll need to continue improving this. `#known-issue`

## Expected To Be Submitted

It's been tough to track down a direct analogue for `expected_to_be_submitted` based on the meaning of this as something the users could set in PMDA. It's unclear if we can just derive it from the status map entirely. For now, the migration sets it to TRUE for all cases. `#open-question`

## Due Dates

When a due date was attached to something determined to be open-ended, it was set to the expiration date of the associated demonstration. This was done before the run of the Upcoming -> Past Due code.

## CMS Owner

As an initial pass, the CMS owner was set to the creator of the deliverable. If this was not resolvable, the user Elizabeth Hill was assigned as the owner. `#open-question`

## Submission Date

There's been a first-pass effort (still work in progress) on importing the submission events from the database and figuring out what the due dates were at the time of the submission event. This is still in progress and needs refinement.
