-- Warn in cases where a deliverable comment is filtered because the comment was null or empty

{{ config(severity='warn') }}

SELECT *
FROM
    {{ ref('errors_deliv_comments_with_empty_content') }}
