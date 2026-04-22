UPDATE
    demos_app.deliverable_action_type
SET
    should_have_note = TRUE
WHERE
    id IN (
        'Requested Extension',
        'Denied Extension Request'
    );

UPDATE
    demos_app.deliverable_action_type
SET
    extension_id_optional = FALSE
WHERE
    id IN (
        'Requested Extension',
        'Approved Extension Request',
        'Denied Extension Request',
        'Withdrew Extension Request'
    );

ALTER TABLE
    demos_app.deliverable_action
ADD CONSTRAINT
    require_extension_id_for_extension_actions
CHECK (
    (extension_id_optional = TRUE) OR (extension_id_optional = FALSE AND active_extension_id IS NULL)
);
