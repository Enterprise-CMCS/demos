/**
 * Source-table context for the DEMOS data dictionary that gets sent to DataConnect.
 * This is hand-maintained documentation, so check often for staleness.
 */
export const SOURCE_TABLE_PURPOSES: Readonly<Record<string, string>> = {
  amendment:
    "An Amendment application linked to an approved demonstration, with its own status, phase, and approval metadata.",
  application:
    "Shared identity and application type for demonstrations, amendments, and extensions, linking their dates, notes, phases, and documents.",
  application_date:
    "Dated milestones attached to an application, keyed by date_type_id.",
  application_note:
    "Free-text notes attached to an application, keyed by note_type_id.",
  budget_neutrality_workbook:
    "Validation status, validation data, and extracted reporting values for a budget-neutrality workbook document.",
  deliverable:
    "A demonstration's deliverable slot, tracking its type, CMS owner, due date, submission expectation, and review status.",
  deliverable_action:
    "Timestamped deliverable workflow actions recording old and new statuses and due dates, with optional user, note, and extension context.",
  deliverable_demonstration_type:
    "Associative table tying a deliverable to a demonstration-type tag.",
  deliverable_extension:
    "Deliverable due-date extension requests, recording reason, status, requested date, and any final date granted.",
  demonstration:
    "A state's Demonstration application, with lifecycle status, phase, effective period, identifiers, and SDG, signature, and clearance metadata.",
  demonstration_role_assignment:
    "Person's role scoped to a single demonstration.",
  demonstration_type_tag_assignment:
    "Assigns a demonstration-type tag to a demonstration for an effective and expiration date window.",
  document:
    "Metadata and S3 location for an application document, optionally linked to a phase or deliverable and a deliverable submission action.",
  extension:
    "An Extension application linked to an approved demonstration, with its own status, phase, and approval metadata.",
  person:
    "Person identity and contact details, linked to person type, an optional user account, and role and state assignments.",
  primary_demonstration_role_assignment:
    "Identifies the primary assignee for a role on a demonstration, referencing an existing demonstration role assignment.",
  private_comment:
    "User-authored deliverable comments exposed through the CMS-protected privateComments field, storing author person type and comment text.",
  public_comment:
    "User-authored deliverable comments exposed through the publicComments field, storing authorship and comment text.",
  state:
    "State and territory codes, names, and CMS regions used by demonstrations and person-state assignments.",
};
