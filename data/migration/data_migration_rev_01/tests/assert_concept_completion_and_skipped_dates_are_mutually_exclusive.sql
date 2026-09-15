-- validate that both the concept_completion_date and concept_skipped_date are not populated at the same time.

SELECT *
FROM
    {{ ref('apps_in_prog_dates_with_checks_cleaned') }}
WHERE
    (
        concept_completion_date IS NOT NULL
        AND concept_skipped_date IS NOT NULL
    )
