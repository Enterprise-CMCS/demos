SET search_path TO demos_app;

ALTER TABLE demos_app.on_demand_report
ADD COLUMN generated_file_name TEXT;

WITH proper_report_names AS (
    SELECT
        id,
        CASE report_type_id
            WHEN 'Basic Test Report' THEN 'Basic_Test_Report_'
            WHEN 'Deliverable Status Report' THEN 'Deliverable_Status_Report_'
            WHEN 'Application Details Report' THEN 'Application_Details_Report_'
            WHEN 'Demonstration Overview Report' THEN 'Demonstration_Overview_Report_'
            WHEN 'Demonstration Types Report' THEN 'Demonstration_Types_Report_'
        END
        || to_char(report_generated_at AT TIME ZONE 'America/New_York', 'YYYYMMDD_HH24MISS_ET.xlsx') AS report_file_name
    FROM
        demos_app.on_demand_report
)

UPDATE
    demos_app.on_demand_report AS odr
SET
    generated_file_name = prn.report_file_name
FROM
    proper_report_names AS prn
WHERE
    odr.id = prn.id;

ALTER TABLE demos_app.on_demand_report
ALTER COLUMN generated_file_name SET NOT NULL;
