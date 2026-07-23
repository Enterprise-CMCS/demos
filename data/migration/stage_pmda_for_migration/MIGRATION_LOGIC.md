# Migration Logic Documentation

This file contains documentation of migration logic decisions that were made.

# Users

- Initial user filtering used `legacy_pmda_raw.users.active = 1`
- Users were filtered out if their email was null, empty string, or failed the regex `^[A-Za-z0-9._+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$`
- Users were filtered out if their first naem or least name were null or empty string
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
    - Note: since CHIP IDs are not required, `NULL` was considerd valid in the `mdcd_scndry_demo_num` field
  - If it was an empty string
    - Note: since CHIP IDs are not required, empty string was considerd valid in the `mdcd_scndry_demo_num` field
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

#### Date Type Derivations

##### Concept Phase

- **Concept Start Date**: Directly mapped from PMDA `phase_1_strt_dt`, with fallback to application created date (`creatd_dt`) when phase start date is NULL
- **Concept Paper Submitted Date**: ❌ Excluded - No equivalent field in PMDA (may be derived later from document metadata if available)
- **Concept Completion Date**: Directly mapped from PMDA `phase_1_end_dt`
- **Concept Skipped Date**: Derived date set to one day before State Application Submitted Date when the Concept phase was not completed (indicates the concept phase was skipped)

##### Application Intake Phase

- **Application Intake Start Date**: Derived date set to one day before the State Application Submitted Date
- **State Application Submitted Date**: Directly mapped from PMDA `phase_2_rcvd_dt`
- **Completeness Review Due Date**: Directly mapped from PMDA `phase_2_cmpltns_rvw_dt`
- **Application Intake Completion Date**: Directly mapped from PMDA `phase_2_cmpltns_rvw_dt`

##### Completeness Phase

- **Completeness Start Date**: Derived date set to one day after the Completeness Review Due Date (Application Intake Completion Date)
- **State Application Deemed Complete**: Directly mapped from PMDA `phase_2_state_aplctn_deemd_cmpltn_dt`
- **Federal Comment Period Start Date**: Directly mapped from PMDA `phase_2_fed_cmt_prd_strt_dt`
- **Federal Comment Period End Date**: Directly mapped from PMDA `phase_2_fed_cmt_prd_end_dt`
- **Completeness Completion Date**: Derived date set to one day before the Federal Comment Period Start Date

##### SDG Preparation Phase

- **SDG Preparation Start Date**: Derived date set to one day after the Federal Comment Period End Date
- **Expected Approval Date**: Directly mapped from PMDA `phase_2_dsrd_aprvl_dt`
- **SME Initial Review Date**: Directly mapped from PMDA `phase_3_a_sme_strt_dt`
- **FRT Initial Meeting Date**: Directly mapped from PMDA `phase_3_a_frvt_strt_dt`
- **BNPMT Initial Meeting Date**: ❌ Excluded - No equivalent field in PMDA
- **SDG Preparation Completion Date**: Derived as the later of SME Initial Review Date or FRT Initial Meeting Date

##### Review Phase

- **Review Start Date**: Derived as the earliest of Receive OGC Legal Clearance, Receive OMB Concurrence, or Submit Approval Package to OSORA dates
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
- **CMS (OSORA) Clearance End**: Directly mapped from PMDA `phase_5_end_dt`
- **Package Sent for COMMs Clearance**: Directly mapped from PMDA `phase_6_strt_dt`
- **COMMs Clearance Received**: Directly mapped from PMDA `phase_6_end_dt`
- **Review Completion Date**: Derived as the later of CMS (OSORA) Clearance End or COMMs Clearance Received dates

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

For each in-progress application, a phase status is determined for all eight phases. Phase statuses follow a dependency chain where **a phase can only be marked as "Completed" if all previous phases are also completed** (or skipped, in the case of Concept).

##### Phase Status Values

The possible phase status values are:

- **Not Started**: The phase has not begun (no dates exist for this phase)
- **Started**: The phase has begun (at least one date exists) but is not complete
- **Completed**: The phase is fully complete (all required dates exist AND all previous phases are complete)
- **Skipped**: Only applicable to the Concept phase when it was bypassed

##### Phase-Specific Status Logic

###### Concept Phase

The Concept phase is always at least "Started" (since all in-progress demos must have begun). Its status is determined as:

- **Skipped**: If `concept_skipped_date` is present
- **Completed**: If `concept_start_date` AND `concept_paper_submitted_date` AND `concept_completion_date` are all present
  - ⚠️ **Note**: Since `concept_paper_submitted_date` is excluded (no PMDA mapping), this phase can never reach "Completed" status during migration
- **Started**: Otherwise (default)

###### Application Intake Phase

Status depends on Concept phase completion:

- **Completed**: If Concept is complete (or skipped) AND all four Application Intake dates exist (`application_intake_start_date`, `state_application_submitted_date`, `completeness_review_due_date`, `application_intake_completion_date`)
- **Started**: If `application_intake_start_date` exists OR Concept is complete (indicating this phase should have started)
- **Not Started**: Otherwise

###### Completeness Phase

Status depends on both Concept and Application Intake completion:

- **Completed**: If Concept AND Application Intake are complete AND all five Completeness dates exist (`completeness_start_date`, `state_application_deemed_complete`, `federal_comment_period_start_date`, `federal_comment_period_end_date`, `completeness_completion_date`)
- **Started**: If `completeness_start_date` exists OR Application Intake is complete
- **Not Started**: Otherwise

###### Federal Comment Period

This is tracked as a separate status (though it overlaps with Completeness phase):

- **Completed**: If Concept AND Application Intake are complete AND both `federal_comment_period_start_date` AND `federal_comment_period_end_date` exist
- **Started**: If either `federal_comment_period_start_date` OR `federal_comment_period_end_date` exists
- **Not Started**: Otherwise

###### SDG Preparation Phase

Status depends on all previous phases (Concept, Application Intake, Completeness) being complete:

- **Completed**: If all previous phases are complete AND all five SDG Preparation dates exist (`sdg_preparation_start_date`, `expected_approval_date`, `sme_initial_review_date`, `frt_initial_meeting_date`, `bnpmt_initial_meeting_date`, `sdg_preparation_completion_date`)
  - ⚠️ **Note**: Since `bnpmt_initial_meeting_date` is excluded (no PMDA mapping), this phase can never reach "Completed" status during migration
- **Started**: If `sdg_preparation_start_date` exists OR all previous phases are complete
- **Not Started**: Otherwise

###### Review Phase

Status depends on all previous phases through SDG Preparation being complete:

- **Completed**: If all previous phases are complete AND all Review dates exist (`review_start_date`, `ogd_approval_to_share_with_smes`, `draft_approval_package_to_prep`, `ddme_approval_received`, `state_concurrence`, `bn_pmt_approval_to_send_to_omb`, `draft_approval_package_shared`, `receive_ogc_legal_clearance`, `receive_omb_concurrence`, `submit_approval_package_to_osora`, `osora_r1_comments_due`, `osora_r2_comments_due`, `cms_osora_clearance_end`, `package_sent_for_comms_clearance`, `comms_clearance_received`, `review_completion_date`)
  - ⚠️ **Note**: Since 8 Review dates are excluded (no PMDA mapping), this phase can never reach "Completed" status during migration
- **Started**: If `review_start_date` exists OR all previous phases are complete
- **Not Started**: Otherwise

###### Approval Package Phase

Status depends on all previous phases through Review being complete:

- **Completed**: If all previous phases are complete AND both `approval_package_start_date` AND `approval_package_completion_date` exist
- **Started**: If `approval_package_start_date` exists OR all previous phases are complete
- **Not Started**: Otherwise

###### Approval Summary Phase

This phase requires all previous phases to be complete AND all Approval Summary dates to exist:

- **Completed**: If all previous phases are complete AND all four Approval Summary dates exist (`application_details_marked_complete_date`, `application_demonstration_types_marked_complete_date`, `approval_summary_start_date`, `approval_summary_completion_date`)
  - ⚠️ **Note**: Since all 4 Approval Summary dates are excluded (no PMDA mapping), this phase can never reach "Completed" status during migration
- **Started**: If any Approval Summary date exists OR all previous phases are complete
- **Not Started**: Otherwise

##### Current Phase Determination

The current phase is determined as the **first phase in the sequence that is not yet completed**. The logic evaluates phases in order:

1. **Concept**: Current if `concept_skipped_date` is NULL AND (`concept_start_date` is NULL OR `concept_paper_submitted_date` is NULL OR `concept_completion_date` is NULL)
2. **Application Intake**: Current if any of the four required dates are missing
3. **Completeness**: Current if any of the five required dates are missing
4. **SDG Preparation**: Current if any of the six required dates are missing (including `bnpmt_initial_meeting_date`)
5. **Review**: Current if any of the 16 required dates are missing (including the 8 excluded dates)
6. **Approval Package**: Current if either of the two required dates are missing
7. **Approval Summary**: Default if all other phases are complete (but note this phase cannot be completed during migration due to excluded dates)

This ensures that the current phase always reflects the earliest incomplete stage of the application workflow.
