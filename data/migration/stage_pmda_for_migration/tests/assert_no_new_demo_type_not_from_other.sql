-- we have predefined demo type names in DEMOS that PMDA's demo types should conform to. However, PMDA has an "other"
-- demo type category which allows for user-defined demo types. This test checks that all demo types in PMDA that are 
-- not marked as "Other" are already present in DEMOS. 
SELECT * FROM {{ ref('errors_demo_type_new_and_not_from_other') }}
UNION ALL
SELECT * FROM {{ ref('errors_demo_type_new_and_not_from_other_pending') }}
