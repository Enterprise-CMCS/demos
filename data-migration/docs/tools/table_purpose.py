"""Shared hand-curated table-purpose blurbs for the data-dictionary generators.

Both `data_dictionary_to_xlsx.py` and `data_dictionary_to_adoc.py` import
these so the per-table intro prose has a single source. The mmd model carries
column-level docs but no per-table prose; this is the single source for that
and rarely changes when the Prisma schema is updated. When a new table lands
upstream, add a one-line blurb here so both generators pick it up.
"""

from __future__ import annotations

PURPOSE: dict[str, str] = {
    "person": (
        "Real-world individual; source of users (CMS identity) and target "
        "of *_role_assignment / person_state."
    ),
    "users": (
        "CMS identity. One users row per person; carries the Cognito subject."
    ),
    "application": (
        "Unifying handle for an application of any type; legacy pending and "
        "approved fold here."
    ),
    "demonstration": (
        "An application of type 'demonstration'; carries SDG / signature / "
        "clearance metadata and the approval-time-required fields."
    ),
    "amendment": (
        "An application of type 'amendment' against an existing demonstration."
    ),
    "extension": (
        "An application of type 'extension' against an existing demonstration."
    ),
    "application_date": (
        "Dated milestones attached to an application, keyed by date_type_id."
    ),
    "application_note": (
        "Free-text notes attached to an application, keyed by note_type_id."
    ),
    "application_phase": (
        "Status of each phase an application has entered."
    ),
    "user_session": (
        "Per-user authentication session counter. One row per "
        "(user_id, auth_time); subsequent auth events for the same session "
        "bump last_auth_event_time and increment auth_event_count. No "
        "history table."
    ),
    "tag_name": (
        "Free-form tag literal (e.g. 'managed-care'); shared across tag types."
    ),
    "tag": "Pairing of name + type with source and status.",
    "demonstration_type_tag_assignment": (
        "Tag attached to a demonstration with effective window. Primary "
        "target for legacy *_pgm_dtl rows."
    ),
    "application_tag_assignment": (
        "Tag attached to an application; no effective window."
    ),
    "application_tag_suggestion": (
        "Net-new in DEMOS. AI-suggested tag value awaiting reconciliation."
    ),
    "application_tag_suggestion_extract": (
        "Source-trace for a suggestion (UiPath value, document position, "
        "field)."
    ),
    "deliverable": (
        "A unit of work produced by a state, tracked through phases."
    ),
    "deliverable_action": (
        "Append-only event log for a deliverable; CHECKs forbid unsupported "
        "transitions."
    ),
    "deliverable_action_configuration": (
        "Configuration: which action_type_id may move from old_status_id to "
        "new_status_id."
    ),
    "deliverable_extension": (
        "A request to push a deliverable's due date out."
    ),
    "deliverable_active_extension": (
        "Singleton pointer: currently active extension per deliverable."
    ),
    "deliverable_demonstration_type": (
        "Associative table tying a deliverable to a demonstration-type tag."
    ),
    "deliverable_type_document_type": (
        "Configuration: which document_type_id values are legal for a "
        "deliverable_type_id."
    ),
    "document": "Clean, S3-resident document.",
    "document_pending_upload": (
        "Document in flight; no s3_path until the AV scan clears."
    ),
    "document_infected": (
        "Document failed the AV scan; carries scan result."
    ),
    "private_comment": (
        "Internal-only commentary by CMS users; carries author's person type."
    ),
    "public_comment": (
        "State-originating commentary; visible across the audience boundary."
    ),
    "budget_neutrality_workbook": (
        "One row per workbook; contents stored as JSONB validated by the "
        "BN schema."
    ),
    "uipath_result": "One row per UiPath document-processing request.",
    "uipath_value": "One row per extracted value from a UiPath result.",
    "role_permission": (
        "Which permissions a role grants, qualified by grant level."
    ),
    "role_person_type": "Which person types may hold a given role.",
    "system_role_assignment": (
        "Person's system-wide (non-demonstration-scoped) role."
    ),
    "demonstration_role_assignment": (
        "Person's role scoped to a single demonstration."
    ),
    "primary_demonstration_role_assignment": (
        "Unique primary holder of each role on a demonstration."
    ),
    "person_state": (
        "States a CMS person is authorised to act in (M:N)."
    ),
    "phase_phase_status": (
        "Configuration: which phase_status_id values are legal for a phase."
    ),
    "phase_date_type": (
        "Configuration: which date_type_id values are legal for a phase."
    ),
    "phase_note_type": (
        "Configuration: which note_type_id values are legal for a phase."
    ),
    "phase_document_type": (
        "Configuration: which document_type_id values are legal for a phase."
    ),
    "reference": (
        "Net-new in DEMOS. A curated reference document (policy guidance, "
        "templates) addressable by id and tagged by demonstration type."
    ),
    "reference_agreement": (
        "An agreement a user must accept before viewing a reference."
    ),
    "reference_agreement_acceptance": (
        "Per-user acceptance record for a reference agreement; 4-column "
        "composite PK. No history table."
    ),
    "reference_configuration": (
        "Configuration controlling reference visibility / lifecycle by "
        "status."
    ),
    "reference_demonstration_type": (
        "Associative table tying a reference to a demonstration-type tag."
    ),
    "reference_tag_assignment": (
        "Tag attached to a reference."
    ),
    "on_demand_report": (
        "Net-new in DEMOS. An on-demand generated report stored in S3; "
        "carries the requesting user, report type, and status. No history "
        "table."
    ),
    "jsonb_schemas": (
        "Migration housekeeping: registered JSONB schemas keyed by name. "
        "Used by the CONSTRAINT TRIGGER in "
        "sql/31_constraint_triggers/00_jsonb_validation.sql to validate "
        "JSONB columns at runtime."
    ),
    "bn_workbook_detail": (
        "Migration-private budget-neutrality aggregate (parity oracle). "
        "Validated against the registered 'budget_neutrality' JSON schema; "
        "NOT the live demos_app.budget_neutrality_workbook.validation_data "
        "column, which DEMOS owns and writes as a ValidationError[] array."
    ),
}

STATIC_CONSTRAINT_PURPOSE = (
    "Static-constraint text-ID lookup. Seed values live in "
    "sql/02_seeds_static/."
)
TYPE_LIMITER_PURPOSE = (
    "Type limiter. Constrains which static-constraint id values are legal "
    "in a given context. Seed values live in sql/03_seeds_limiters/."
)
