# Migration Logic Documentation

This file contains documentation of migration logic decisions that were made.

# Users

- Initial user filtering used `legacy_pmda_raw.users.active = 1`
- Users were filtered out if their email was null, empty string, or failed the regex `^[A-Za-z0-9._+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$`
- Users were filtered out if their first naem or least name were null or empty string
- Users were filtered out if their PMDA user roles (`legacy_pmda_raw.user_role_asgnmt`) could not be mapped to a DEMOS `person_type_id`
  - This would occur if there were no roles assigned in PMDA
- If a PMDA user's roles would resolve to multiple DEMOS `person_type_id` records, the ***HIGHEST*** `person_type_id` was selected

# Applications

## Demonstrations

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

Approved demonstrations in DEMOS are required to have at least one demonstration type. To ensure that this constraint was met, a demonstration type called `Migrated from PMDA` was added, and assigned to all the "finalized" demonstrations that were migrated.

### Phases and Dates for Finalized Demonstrations

The date data available from PMDA is sparse relative to the requirements of DEMOS. Since "finalized" or approved demonstrations do not need to move through the application process, these were migrated with no values populated into `demos_app.application_date`. All eight phases in `application_phase` were set to `Completed`.
