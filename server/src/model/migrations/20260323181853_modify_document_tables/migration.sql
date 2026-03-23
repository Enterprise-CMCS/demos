INSERT INTO
    demos_app.deliverable_submission_action_type_limit
VALUES
    ('Submitted Deliverable');

UPDATE
    demos_app.document_type
SET
    id = 'BN Workbook'
WHERE
    id = 'Final BN Worksheet';

UPDATE
    demos_app.deliverable_type
SET
    id = 'Demonstration-Specific Deliverable'
WHERE
    id = 'Demonstration-specific Deliverable';

INSERT INTO
    demos_app.document_type
VALUES
    ('BN Template'),
    ('Close Out Report'),
    ('Demonstration-Specific Deliverable'),
    ('Evaluation Design'),
    ('HCBS Actual and Estimated Enrollment Number Report (1915(i)-like)'),
    ('HCBS Deficiency, Remediation and A/N/E Incident Report (1915(c)-like)'),
    ('HCBS Evidentiary Report'),
    ('HCBS Performance Measures Report'),
    ('HCBS Quality Improvement Strategy Report'),
    ('Implementation Plan'),
    ('Interim Evaluation Report'),
    ('Mid-point Assessment'),
    ('Monitoring Protocol'),
    ('Monitoring Report'),
    ('Summative Evaluation Report'),
    ('Transition Plan');

INSERT INTO
    demos_app.deliverable_type_document_type
VALUES
    -- All deliverable types allow General File
    ('Annual Budget Neutrality Report', 'General File'),
    ('Close Out Report', 'General File'),
    ('Demonstration-Specific Deliverable', 'General File'),
    ('Evaluation Design', 'General File'),
    ('HCBS Actual and Estimated Enrollment Number Report (1915(i)-like)', 'General File'),
    ('HCBS Deficiency, Remediation and A/N/E Incident Report (1915(c)-like)', 'General File'),
    ('HCBS Evidentiary Report', 'General File'),
    ('HCBS Performance Measures Report', 'General File'),
    ('HCBS Quality Improvement Strategy Report', 'General File'),
    ('Implementation Plan', 'General File'),
    ('Interim Evaluation Report', 'General File'),
    ('Mid-point Assessment', 'General File'),
    ('Monitoring Protocol', 'General File'),
    ('Monitoring Report', 'General File'),
    ('Quarterly Budget Neutrality Report', 'General File'),
    ('Summative Evaluation Report', 'General File'),
    ('Transition Plan', 'General File'),

    -- Most deliverable types take their own document type
    ('Close Out Report', 'Close Out Report'),
    ('Demonstration-Specific Deliverable', 'Demonstration-Specific Deliverable'),
    ('Evaluation Design', 'Evaluation Design'),
    ('HCBS Actual and Estimated Enrollment Number Report (1915(i)-like)', 'HCBS Actual and Estimated Enrollment Number Report (1915(i)-like)'),
    ('HCBS Deficiency, Remediation and A/N/E Incident Report (1915(c)-like)', 'HCBS Deficiency, Remediation and A/N/E Incident Report (1915(c)-like)'),
    ('HCBS Evidentiary Report', 'HCBS Evidentiary Report'),
    ('HCBS Performance Measures Report', 'HCBS Performance Measures Report'),
    ('HCBS Quality Improvement Strategy Report', 'HCBS Quality Improvement Strategy Report'),
    ('Implementation Plan', 'Implementation Plan'),
    ('Interim Evaluation Report', 'Interim Evaluation Report'),
    ('Mid-point Assessment', 'Mid-point Assessment'),
    ('Monitoring Protocol', 'Monitoring Protocol'),
    ('Monitoring Report', 'Monitoring Report'),
    ('Summative Evaluation Report', 'Summative Evaluation Report'),
    ('Transition Plan', 'Transition Plan'),

    -- Budget neutrality deliverables take budget neutrality documents
    ('Annual Budget Neutrality Report', 'BN Workbook'),
    ('Annual Budget Neutrality Report', 'BN Template'),
    ('Quarterly Budget Neutrality Report', 'BN Workbook'),
    ('Quarterly Budget Neutrality Report', 'BN Template');
