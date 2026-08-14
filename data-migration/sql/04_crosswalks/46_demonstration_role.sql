/*
 * Purpose:    Define (DDL) the crosswalk table mapping each legacy mdcd_demo per-role user_id COLUMN to a DEMOS Demonstration-grant role assignment tuple.
 * Inputs:     none (DDL only); rows loaded from reports/crosswalks/demonstration_role.csv by the crosswalks phase.
 * Outputs:    mysql_raw.crosswalk_demonstration_role
 * Invariants: idempotent (DROP TABLE IF EXISTS + CREATE); scoped to the Demonstration grant level (System tuples live in 44_system_role.sql); at most one is_primary column per source_table; treat_zero_as_null drops 0-valued source columns; the CSV is the single source (never edit the table directly); 47_demonstration_role_check.sql validates rows against the DEMOS seeds.
 * Refs:       reports/crosswalks/demonstration_role.csv, sql/04_crosswalks/44_system_role.sql
 *
 * Crosswalk: legacy MySQL per-role user_id COLUMN -> DEMOS demonstration-level
 * role assignment tuple. SELF-CONTAINED and deliberately scoped to the
 * Demonstration grant level; the System-grant tuples live in the sibling
 * 44_system_role.sql. (The earlier unified crosswalk_role workstream,
 * 40_role.sql / 41_role_check.sql, was superseded by this split and removed.)
 *
 * SOURCE SHAPE: PMDA has no (user, demonstration, role) association table.
 * Instead mdcd_demo carries one user_id FK column per functional role
 * (proj_ofcr_user_id, anlyst_user_id, state_prmry_poc_user_id, ...). Each
 * populated column on a kept demonstration is exactly one
 * (person, demonstration, role) tuple, with the role determined by the
 * COLUMN's semantics. This crosswalk maps each source column to the DEMOS
 * role_id it projects onto.
 *
 * DEMOS demonstration_role_assignment is NOT permission-bearing (the pinned
 * DDL seeds zero role_permission rows at the Demonstration grant level): it is
 * the membership/scoping + title layer. Capability rides on the System role
 * (system_role_assignment). So column folds below mislabel a TITLE, never a
 * privilege grant.
 *
 * COLUMN SEMANTICS (SME-confirmed):
 *   tchncl_drctr_user_id -> Policy Technical Director always (M&E TD has its
 *     own dedicated column; Rule A). If the same person also fills the M&E
 *     column they get both rows (distinct role_ids).
 *   ro_fincl_lead_user_id     -> Project Officer (Financial Lead fold).
 *   ro_mntrg_lead_user_id     -> Monitoring & Evaluation Technical Director.
 *   mc_anlyst_id / hcbs_anlyst_id -> DDME Analyst (no MC/HCBS-specific role).
 *   bkup_proj_ofcr_user_id    -> Project Officer (non-primary); the source
 *     column is NOT NULL DEFAULT 0, so 0 means "no backup" -> treat_zero_as_null.
 *   proj_ofcr_user_id         -> Project Officer, is_primary = true (feeds
 *     primary_demonstration_role_assignment).
 *
 * is_primary marks the single tuple per demonstration that DEMOS records in
 * primary_demonstration_role_assignment (only proj_ofcr_user_id today).
 * treat_zero_as_null tells the resolver to drop a 0-valued source column.
 *
 * SCOPE: live mdcd_demo only. mdcd_pendg_demo is NOT yet loaded as a
 * demos_app.demonstration, so a pending-demo role assignment would dangle the
 * demonstration FK; the resolver is structured to extend to it once a
 * pending-demo demonstration loader exists, but no mdcd_pendg_demo rows are
 * mapped here yet.
 *
 * 47_demonstration_role_check.sql validates every row against the DEMOS seeds:
 *   (role_id, grant_level_id)  in demos_app.role
 *   grant_level_id             in demos_app.demonstration_grant_level_limit
 * Rows are loaded from reports/crosswalks/demonstration_role.csv by the
 * crosswalks phase (the CSV is the single source). Never edit the table directly.
 */
DROP TABLE IF EXISTS mysql_raw.crosswalk_demonstration_role;

CREATE TABLE mysql_raw.crosswalk_demonstration_role(
  source_table text NOT NULL CHECK (source_table IN ('mdcd_demo', 'mdcd_pendg_demo')),
  source_column text NOT NULL,
  role_id text NOT NULL,
  grant_level_id text NOT NULL,
  is_primary boolean NOT NULL DEFAULT FALSE,
  treat_zero_as_null boolean NOT NULL DEFAULT FALSE,
  notes text,
  PRIMARY KEY (source_table, source_column)
);

-- Values loaded from reports/crosswalks/demonstration_role.csv by the crosswalks phase.
