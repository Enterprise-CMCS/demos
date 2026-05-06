SET search_path TO demos_app;

-- Partial unique indexes are not supported yet in Prisma
-- This is manually managing it; please ensure it is not removed in future migrations
CREATE UNIQUE INDEX unique_index_on_deliverable_extension_actions
ON demos_app.deliverable_action (action_type_id, active_extension_id)
WHERE
    action_type_id IN (
        'Approved Extension Request',
        'Withdrew Extension Request',
        'Requested Extension',
        'Denied Extension Request'
    );

-- Also adds some missing non-empty checks
ALTER TABLE
    demos_app.deliverable
ADD CONSTRAINT
    check_non_empty_name
CHECK (
    trim(name) != ''
);
