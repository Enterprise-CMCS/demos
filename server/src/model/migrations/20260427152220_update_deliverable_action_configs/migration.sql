DELETE FROM
    demos_app.deliverable_action_configuration
WHERE
    old_status_id IN (
        'Accepted',
        'Approved',
        'Received and Filed'
    )
    AND action_type_id IN (
        'Approved Extension Request',
        'Denied Extension Request',
        'Withdrew Extension Request',
        'Manually Changed Due Date'
    );
