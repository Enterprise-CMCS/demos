ALTER TABLE
    demos_app.on_demand_report
ADD CONSTRAINT
    check_non_empty_s3_path
CHECK (
    trim(s3_path) != ''
);

INSERT INTO
    demos_app.on_demand_report_status
VALUES
    ('Available');

INSERT INTO
    demos_app.on_demand_report_type
VALUES
    ('Basic Test Report');
