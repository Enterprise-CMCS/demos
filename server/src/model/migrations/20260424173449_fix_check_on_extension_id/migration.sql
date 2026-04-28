ALTER TABLE
    demos_app.deliverable_action
DROP CONSTRAINT
    require_extension_id_for_extension_actions;

ALTER TABLE
    demos_app.deliverable_action
ADD CONSTRAINT
    require_extension_id_for_extension_actions
CHECK (
    (extension_id_optional = TRUE) OR
    (extension_id_optional = FALSE AND active_extension_id IS NOT NULL)
);
