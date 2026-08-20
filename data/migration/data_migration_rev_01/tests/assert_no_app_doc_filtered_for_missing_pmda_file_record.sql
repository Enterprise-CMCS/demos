-- Warn in cases where an app document is filtered because it couldn't be joined to a PMDA file record

{{ config(severity='warn') }}

SELECT *
FROM
    {{ ref('errors_app_docs_missing_aplctn_doc_rpstry_fil') }}
