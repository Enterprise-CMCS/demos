-- Warn in cases where a deliverable comment is filtered because it can't be matched to a user

{{ config(severity='warn') }}

SELECT *
FROM
    {{ ref('errors_deliv_comments_with_no_matched_user') }}
