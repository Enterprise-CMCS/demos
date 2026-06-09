INSERT INTO
    demos_app.tag_type
VALUES
    ('Reference');

INSERT INTO
    demos_app.reference_tag_type_limit
VALUES
    ('Reference');

INSERT INTO
    demos_app.tag_name
VALUES
    ('FAQ', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO
    demos_app.tag
VALUES
    ('FAQ', 'Reference', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO
    demos_app.reference_configuration_status
VALUES
    ('Active'),
    ('Inactive');

ALTER TABLE
    demos_app.reference
ADD CONSTRAINT
    check_non_empty_name
CHECK (
    trim(name) != ''
);

ALTER TABLE
    demos_app.reference
ADD CONSTRAINT
    check_non_empty_s3_path
CHECK (
    trim(s3_path) != ''
);

ALTER TABLE
    demos_app.reference_agreement
ADD CONSTRAINT
    check_non_empty_name
CHECK (
    trim(name) != ''
);

ALTER TABLE
    demos_app.reference_agreement
ADD CONSTRAINT
    check_non_empty_s3_path
CHECK (
    trim(s3_path) != ''
);
