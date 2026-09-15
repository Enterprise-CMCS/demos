const dataFetchQuery = `
WITH primary_roles AS (
    SELECT
        p.first_name || ' ' || p.last_name AS full_name,
        pdra.demonstration_id,
        pdra.role_id
    FROM
        demos_app.primary_demonstration_role_assignment AS pdra
    INNER JOIN
        demos_app.person AS p
        ON
            pdra.person_id = p.id
),

flat_demonstration_types AS (
    SELECT
        deliverable_id,
        string_agg(demonstration_type_tag_name_id, ', ' ORDER BY demonstration_type_tag_name_id) AS demonstration_types
    FROM
        demos_app.deliverable_demonstration_type
    GROUP BY
        deliverable_id
),

action_statistics AS (
    SELECT DISTINCT
        deliverable_id,
        max(CASE WHEN action_type_id = 'Submitted Deliverable' THEN action_timestamp END)
            OVER (PARTITION BY deliverable_id)
            AS most_recent_submission_timestamp,
        max(CASE WHEN action_type_id = 'Requested Resubmission' THEN action_timestamp END)
            OVER (PARTITION BY deliverable_id)
            AS most_recent_resubmission_request_timestamp,
        max(
            CASE
                WHEN
                    action_type_id IN (
                        'Accepted Deliverable',
                        'Approved Deliverable',
                        'Received and Filed Deliverable'
                    )
                    THEN action_timestamp
            END
        ) OVER (PARTITION BY deliverable_id) AS most_recent_finalization_timestamp,
        sum(CASE WHEN action_type_id = 'Requested Extension' THEN 1 ELSE 0 END)
            OVER (PARTITION BY deliverable_id)::INT
            AS n_requested_extensions,
        sum(CASE WHEN action_type_id = 'Requested Resubmission' THEN 1 ELSE 0 END)
            OVER (PARTITION BY deliverable_id)::INT
            AS n_requested_resubmissions,
        max(action_timestamp) OVER (PARTITION BY deliverable_id) AS most_recent_action_timestamp,
        first_value(action_type_id)
            OVER (PARTITION BY deliverable_id ORDER BY action_timestamp DESC)
            AS most_recent_action_type
    FROM
        demos_app.deliverable_action
),

-- Only one extension can be Requested at a time by DB rules
-- Means we don't need to mess with first_value(), etc
current_extensions AS (
    SELECT
        'Yes' AS extension_request_pending,
        de.id,
        de.deliverable_id,
        de.original_date_requested,
        de.reason_code_id,
        da.note
    FROM
        demos_app.deliverable_extension AS de
    INNER JOIN
        demos_app.deliverable_action AS da
        ON
            de.id = da.active_extension_id
            AND da.action_type_id = 'Requested Extension'
            AND de.status_id = 'Requested'
),

most_recent_resub_reqs AS (
    SELECT DISTINCT
        deliverable_id,
        first_value(id) OVER (PARTITION BY deliverable_id ORDER BY action_timestamp DESC) AS id,
        first_value(note) OVER (PARTITION BY deliverable_id ORDER BY action_timestamp DESC) AS note,
        first_value(new_due_date) OVER (PARTITION BY deliverable_id ORDER BY action_timestamp DESC) AS new_due_date
    FROM
        demos_app.deliverable_action
    WHERE
        action_type_id = 'Requested Resubmission'
),

most_recent_public_comment AS (
    SELECT
        deliverable_id,
        'Yes' AS updated_post_acceptance,
        max(created_at) AS created_at
    FROM
        demos_app.public_comment
    GROUP BY
        deliverable_id
),

most_recent_review_start AS (
    SELECT DISTINCT
        da.deliverable_id,
        first_value(p.first_name || ' ' || p.last_name)
            OVER (PARTITION BY da.deliverable_id ORDER BY da.action_timestamp DESC)
            AS full_name,
        max(da.action_timestamp) OVER (PARTITION BY da.deliverable_id) AS action_timestamp
    FROM
        demos_app.deliverable_action AS da
    INNER JOIN
        demos_app.person AS p
        ON
            da.user_id = p.id AND da.action_type_id = 'Started Review'
),

most_recent_valid_bn_data AS (
    SELECT DISTINCT
        doc.deliverable_id,
        first_value(bn.net_variance_total)
            OVER (PARTITION BY da.deliverable_id ORDER BY da.action_timestamp DESC)
            AS net_variance_total,
        first_value(bn.actuals) OVER (PARTITION BY da.deliverable_id ORDER BY da.action_timestamp DESC) AS actuals
    FROM
        demos_app.budget_neutrality_workbook AS bn

    -- Get to the deliverable from the document
    INNER JOIN
        demos_app.document AS doc
        ON
            bn.id = doc.id

    -- Inner join here filters those not submitted
    -- Also filters non-successes
    INNER JOIN
        demos_app.deliverable_action AS da
        ON
            doc.deliverable_submission_action_id = da.id
            AND bn.validation_status_id = 'Succeeded'
),

aggregate_public_comments AS (
    SELECT
        pbc.deliverable_id,
        string_agg(
            p.first_name
            || ' '
            || p.last_name
            || ':'
            || to_char(pbc.created_at AT TIME ZONE 'America/New_York', 'MM/DD/YYYY')
            || ':'
            || pbc.content,
            E'\r\n' ORDER BY pbc.created_at
        ) AS comment_value
    FROM
        demos_app.public_comment AS pbc
    INNER JOIN
        demos_app.person AS p
        ON
            pbc.author_user_id = p.id
    GROUP BY pbc.deliverable_id
),

aggregate_private_comments AS (
    SELECT
        pvc.deliverable_id,
        string_agg(
            p.first_name
            || ' '
            || p.last_name
            || ':'
            || to_char(pvc.created_at AT TIME ZONE 'America/New_York', 'MM/DD/YYYY')
            || ':'
            || pvc.content,
            E'\r\n' ORDER BY pvc.created_at
        ) AS comment_value
    FROM
        demos_app.private_comment AS pvc
    INNER JOIN
        demos_app.person AS p
        ON
            pvc.author_user_id = p.id
    GROUP BY pvc.deliverable_id
)

SELECT
    demo_state.name AS state,
    demo.name AS demonstration_title,
    demo.medicaid_id AS demonstration_number,
    to_char(demo.effective_date AT TIME ZONE 'America/New_York', 'MM/DD/YYYY') AS effective_date,
    to_char(demo.expiration_date AT TIME ZONE 'America/New_York', 'MM/DD/YYYY') AS expiration_date,
    primary_project_officer.full_name AS primary_project_officer,
    coalesce(primary_ddme_analyst.full_name, '-') AS ddme_analyst,
    deliv.deliverable_type_id AS deliverable_type,
    deliv.name AS deliverable_name,
    coalesce(demo_types.demonstration_types, '-') AS demonstration_types,
    cms_owner.first_name || ' ' || cms_owner.last_name AS cms_owner,
    to_char(deliv.due_date AT TIME ZONE 'America/New_York', 'MM/DD/YYYY') AS due_date,
    coalesce(to_char(act_stats.most_recent_submission_timestamp AT TIME ZONE 'America/New_York', 'MM/DD/YYYY'), '-')
        AS submission_date,
    coalesce(current_extensions.extension_request_pending, 'No') AS extension_request_pending,
    coalesce(to_char(current_extensions.original_date_requested AT TIME ZONE 'America/New_York', 'MM/DD/YYYY'), '-')
        AS extension_date_requested,
    coalesce(current_extensions.reason_code_id, '-') AS reason_for_extension,
    coalesce(current_extensions.note, '-') AS extension_request_comments,
    act_stats.n_requested_extensions AS total_extensions_requested,
    coalesce(to_char(most_recent_resub_reqs.new_due_date AT TIME ZONE 'America/New_York', 'MM/DD/YYYY'), '-')
        AS resubmission_due_date,
    coalesce(most_recent_resub_reqs.note, '-') AS resubmission_request_comments,
    act_stats.n_requested_resubmissions AS total_resubmissions_requested,
    deliv.status_id AS deliverable_status,
    act_stats.most_recent_action_type AS last_deliverable_action,
    to_char(act_stats.most_recent_action_timestamp AT TIME ZONE 'America/New_York', 'MM/DD/YYYY')
        AS last_deliverable_action_date,
    coalesce(most_recent_public_comment.updated_post_acceptance, 'No') AS updated_post_acceptance,
    coalesce(most_recent_review_start.full_name, '-') AS deliverable_reviewer,
    coalesce(to_char(most_recent_review_start.action_timestamp AT TIME ZONE 'America/New_York', 'MM/DD/YYYY'), '-')
        AS deliverable_review_date,
    coalesce(most_recent_valid_bn_data.net_variance_total::TEXT, '-') AS budget_neutrality_variance,
    coalesce(most_recent_valid_bn_data.actuals, '-') AS actuals,
    left(coalesce(aggregate_public_comments.comment_value, '-'), 32000) AS public_comments,
    left(coalesce(aggregate_private_comments.comment_value, '-'), 32000) AS private_comments
FROM
    demos_app.deliverable AS deliv

-- All deliverables have demonstrations
INNER JOIN
    demos_app.demonstration AS demo
    ON
        deliv.demonstration_id = demo.id

-- Every demonstration has a state
INNER JOIN
    demos_app.state AS demo_state
    ON
        demo.state_id = demo_state.id

-- Primary Project Officer is guaranteed to exist
INNER JOIN
    primary_roles AS primary_project_officer
    ON
        deliv.demonstration_id = primary_project_officer.demonstration_id
        AND primary_project_officer.role_id = 'Project Officer'

-- Primary DDME Analyst is not guaranteed to exist
LEFT JOIN
    primary_roles AS primary_ddme_analyst
    ON
        deliv.demonstration_id = primary_ddme_analyst.demonstration_id
        AND primary_ddme_analyst.role_id = 'DDME Analyst'

-- Deliverables are not guaranteed to have demonstration types associated
LEFT JOIN
    flat_demonstration_types AS demo_types
    ON
        deliv.id = demo_types.deliverable_id

-- All deliverables have CMS owners
INNER JOIN
    demos_app.person AS cms_owner
    ON
        deliv.cms_owner_user_id = cms_owner.id

-- All deliverables will have action statistics
INNER JOIN
    action_statistics AS act_stats
    ON
        deliv.id = act_stats.deliverable_id

-- Not all deliverables have active extension requests
LEFT JOIN
    current_extensions
    ON
        deliv.id = current_extensions.deliverable_id

-- Not all deliverables have current resubmission requests
-- Define current request as one where most recent resub request after most recent submission
LEFT JOIN
    most_recent_resub_reqs
    ON
        deliv.id = most_recent_resub_reqs.deliverable_id
        AND act_stats.most_recent_submission_timestamp
        < act_stats.most_recent_resubmission_request_timestamp

-- Not all deliverables have comments
-- Filter joined rows based on deliverable status and dates
LEFT JOIN
    most_recent_public_comment
    ON
        deliv.id = most_recent_public_comment.deliverable_id
        AND deliv.status_id IN ('Accepted', 'Approved', 'Received and Filed')
        AND act_stats.most_recent_finalization_timestamp < most_recent_public_comment.created_at

-- Not all deliverables have reviews started
LEFT JOIN
    most_recent_review_start
    ON
        deliv.id = most_recent_review_start.deliverable_id

-- Not all deliverables have BN data
LEFT JOIN
    most_recent_valid_bn_data
    ON
        deliv.id = most_recent_valid_bn_data.deliverable_id

-- Not all deliverables have comments (again)
LEFT JOIN
    aggregate_public_comments
    ON
        deliv.id = aggregate_public_comments.deliverable_id

LEFT JOIN
    aggregate_private_comments
    ON
        deliv.id = aggregate_private_comments.deliverable_id

-- Finally: don't show deleted deliverables
WHERE
    deliv.status_id != 'Deleted';
`;

export const deliverableStatusReportQueries = [dataFetchQuery];
