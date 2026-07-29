/*
 * Purpose: Define and seed migration.deliverable_action_chain, the ordered minimal sequence of deliverable_action hops that reconstructs how a deliverable reached each terminal status; migration-private reference data driving the MINIMAL deliverable_action synthesis; idempotent.
 * Refs:    sql/04_crosswalks/74_deliverable_action_chain_check.sql, sql/23_app_derived/60_deliverable_action.sql, reports/narrative/pending_approved_decisions.md
 *
 * PMDA keeps no per-transition action history: mdcd_dlvrbl stores only a current
 * status (mdcd_dlvrbl_crnt_stus_cd) plus a handful of loose dates. DEMOS, by
 * contrast, renders a deliverable's timeline from demos_app.deliverable_action
 * and enforces every transition against demos_app.deliverable_action_configuration.
 * A migrated deliverable with no action rows therefore shows an empty history
 * for its whole life before cutover.
 *
 * This seed is the MINIMAL reconstruction: for each terminal status, the
 * shortest hop sequence through DEMOS's own configuration graph that starts at
 * 'Upcoming' (where every deliverable begins, via 'Created Deliverable Slot')
 * and ends at that status. It is a claim about the transitions DEMOS itself
 * considers legal, NOT a claim that PMDA recorded them. What is real per hop:
 *
 *   real       the terminal status, and the terminal timestamp
 *              (mdcd_dlvrbl.dlvrbl_stus_updt_dt)
 *   synthetic  the intermediate hops, their timestamps (terminal minus one
 *              second per step back), and the actor on every hop
 *
 * Only the shortest path is seeded, so a deliverable that really bounced
 * (submitted, resubmission requested, submitted again) collapses to one pass.
 * Re-derivation is intentionally impossible from the source, and inventing
 * plausible extra loops would add fiction without adding truth.
 *
 * Deliberately absent terminal statuses:
 *   Deleted   soft-deleted deliverables are out of migration scope, so no
 *             loaded deliverable can carry it. 74_* fails the run if one ever
 *             does, rather than silently skipping its actions.
 *
 * 'Marked as Past Due' is the one seeded action type with should_have_user_id
 * = FALSE (DEMOS marks a deliverable past due on a timer, not by a human), so
 * its hop carries a NULL user_id. 74_* asserts that against the live seed
 * rather than trusting this comment.
 *
 * No FK to demos_app.deliverable_action_configuration on purpose: demos_app.* is
 * rebuilt/truncated during the build phases and migration.* must survive
 * independently. 74_* re-checks the reference at run time instead.
 */
SET search_path TO migration, public;

CREATE TABLE IF NOT EXISTS migration.deliverable_action_chain(
  terminal_status_id text NOT NULL,
  hop_seq smallint NOT NULL CHECK (hop_seq >= 1),
  action_type_id text NOT NULL,
  old_status_id text NOT NULL,
  new_status_id text NOT NULL,
  PRIMARY KEY (terminal_status_id, hop_seq)
);

INSERT INTO migration.deliverable_action_chain(terminal_status_id, hop_seq, action_type_id, old_status_id, new_status_id)
VALUES
  ('Upcoming', 1, 'Created Deliverable Slot', 'Upcoming', 'Upcoming'),
('Past Due', 1, 'Created Deliverable Slot', 'Upcoming', 'Upcoming'),
('Past Due', 2, 'Marked as Past Due', 'Upcoming', 'Past Due'),
('Submitted', 1, 'Created Deliverable Slot', 'Upcoming', 'Upcoming'),
('Submitted', 2, 'Submitted Deliverable', 'Upcoming', 'Submitted'),
('Under CMS Review', 1, 'Created Deliverable Slot', 'Upcoming', 'Upcoming'),
('Under CMS Review', 2, 'Submitted Deliverable', 'Upcoming', 'Submitted'),
('Under CMS Review', 3, 'Started Review', 'Submitted', 'Under CMS Review'),
('Accepted', 1, 'Created Deliverable Slot', 'Upcoming', 'Upcoming'),
('Accepted', 2, 'Submitted Deliverable', 'Upcoming', 'Submitted'),
('Accepted', 3, 'Started Review', 'Submitted', 'Under CMS Review'),
('Accepted', 4, 'Accepted Deliverable', 'Under CMS Review', 'Accepted'),
('Approved', 1, 'Created Deliverable Slot', 'Upcoming', 'Upcoming'),
('Approved', 2, 'Submitted Deliverable', 'Upcoming', 'Submitted'),
('Approved', 3, 'Started Review', 'Submitted', 'Under CMS Review'),
('Approved', 4, 'Approved Deliverable', 'Under CMS Review', 'Approved'),
('Received and Filed', 1, 'Created Deliverable Slot', 'Upcoming', 'Upcoming'),
('Received and Filed', 2, 'Submitted Deliverable', 'Upcoming', 'Submitted'),
('Received and Filed', 3, 'Started Review', 'Submitted', 'Under CMS Review'),
('Received and Filed', 4, 'Received and Filed Deliverable', 'Under CMS Review', 'Received and Filed')
ON CONFLICT (terminal_status_id, hop_seq)
  DO UPDATE SET
    action_type_id = excluded.action_type_id,
    old_status_id = excluded.old_status_id,
    new_status_id = excluded.new_status_id;

