SELECT * FROM {{ ref('docs_pmda_app_docs_rpstry_doc_type_phase') }}
WHERE document_type_id = 'BN Workbook'
