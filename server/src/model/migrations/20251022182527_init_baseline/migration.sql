-- Populate Constraint Tables
INSERT INTO
    demos_app.application_status
VALUES
    ('Pre-Submission'),
    ('Under Review'),
    ('Approved'),
    ('Denied'),
    ('Withdrawn'),
    ('On-hold');

INSERT INTO
    demos_app.grant_level
VALUES
    ('System'),
    ('Demonstration');

INSERT INTO
    demos_app.system_grant_level_limit
VALUES
    ('System');

INSERT INTO
    demos_app.demonstration_grant_level_limit
VALUES
    ('Demonstration');

INSERT INTO
    demos_app.role
VALUES
    ('Project Officer', 'Demonstration'),
    ('State Point of Contact', 'Demonstration'),
    ('DDME Analyst', 'Demonstration'),
    ('Policy Technical Director', 'Demonstration'),
    ('Monitoring & Evaluation Technical Director', 'Demonstration'),
    ('All Users', 'System');

INSERT INTO
    demos_app.person_type
VALUES
    ('demos-admin'),
    ('demos-cms-user'),
    ('demos-state-user'),
    ('non-user-contact');

INSERT INTO
    demos_app.role_person_type
VALUES
    ('Project Officer', 'demos-admin'),
    ('Project Officer', 'demos-cms-user'),
    ('State Point of Contact', 'demos-admin'),
    ('State Point of Contact', 'demos-state-user'),
    ('DDME Analyst', 'demos-admin'),
    ('DDME Analyst', 'demos-cms-user'),
    ('Policy Technical Director', 'demos-admin'),
    ('Policy Technical Director', 'demos-cms-user'),
    ('Monitoring & Evaluation Technical Director', 'demos-admin'),
    ('Monitoring & Evaluation Technical Director', 'demos-cms-user'),
    ('All Users', 'demos-admin'),  
    ('All Users', 'demos-cms-user'),
    ('All Users', 'demos-state-user');

INSERT INTO
    demos_app.user_person_type_limit
VALUES
    ('demos-admin'),
    ('demos-cms-user'),
    ('demos-state-user');

INSERT INTO
    demos_app.application_type
VALUES
    ('Demonstration'),
    ('Amendment'),
    ('Extension');

INSERT INTO
    demos_app.demonstration_application_type_limit
VALUES
    ('Demonstration');

INSERT INTO
    demos_app.amendment_application_type_limit
VALUES
    ('Amendment');

INSERT INTO
    demos_app.extension_application_type_limit
VALUES
    ('Extension');

INSERT INTO
    demos_app.signature_level
VALUES
    ('OA'),
    ('OCD'),
    ('OGD');

INSERT INTO
    demos_app.sdg_division
VALUES
    ('Division of System Reform Demonstrations'),
    ('Division of Eligibility and Coverage Demonstrations');

INSERT INTO
    demos_app.document_type
VALUES
    ('Application Completeness Letter'),
    ('Approval Letter'),
    ('Final BN Worksheet'),
    ('Final Budget Neutrality Formulation Workbook'),
    ('Formal OMB Policy Concurrence Email'),
    ('General File'),
    ('Internal Completeness Review Form'),
    ('Payment Ratio Analysis'),
    ('Pre-Submission'),
    ('Q&A'),
    ('Signed Decision Memo'),
    ('State Application');

INSERT INTO
    demos_app.phase
VALUES
    ('None', 0),
    ('Concept', 1),
    ('Application Intake', 2),
    ('Completeness', 3),
    ('Federal Comment', 4),
    ('SDG Preparation', 5),
    ('OGC & OMB Review', 6),
    ('Approval Package', 7),
    ('Post Approval', 8);

INSERT INTO
    demos_app.phase_status
VALUES
    ('Not Started'),
    ('Started'),
    ('Completed'),
    ('Incomplete'),
    ('Skipped');

INSERT INTO
    demos_app.phase_document_type
VALUES
    -- None phase currently allows all document types
    ('None', 'Application Completeness Letter'),
    ('None', 'Approval Letter'),
    ('None', 'Final BN Worksheet'),
    ('None', 'Final Budget Neutrality Formulation Workbook'),
    ('None', 'Formal OMB Policy Concurrence Email'),
    ('None', 'Internal Completeness Review Form'),
    ('None', 'Payment Ratio Analysis'),
    ('None', 'Pre-Submission'),
    ('None', 'Q&A'),
    ('None', 'Signed Decision Memo'),
    ('None', 'State Application'),
    ('None', 'General File'),

    -- General File is allowed for all phases
    ('Concept', 'General File'),
    ('Application Intake', 'General File'),
    ('Completeness', 'General File'),
    ('Federal Comment', 'General File'),
    ('SDG Preparation', 'General File'),
    ('OGC & OMB Review', 'General File'),
    ('Approval Package', 'General File'),
    ('Post Approval', 'General File'),

    -- Now, add phase-specific documents
    ('Concept', 'Pre-Submission'),
    ('Application Intake', 'State Application'),
    ('Completeness', 'Internal Completeness Review Form'),
    ('Completeness', 'Application Completeness Letter'),
    ('Approval Package', 'Approval Letter'),
    ('Approval Package', 'Final BN Worksheet'),
    ('Approval Package', 'Final Budget Neutrality Formulation Workbook'),
    ('Approval Package', 'Formal OMB Policy Concurrence Email'),
    ('Approval Package', 'Payment Ratio Analysis'),
    ('Approval Package', 'Q&A'),
    ('Approval Package', 'Signed Decision Memo');

INSERT INTO
    demos_app.date_type
VALUES
    ('Concept Start Date'),
    ('Pre-Submission Submitted Date'),
    ('Concept Completion Date'),
    ('Application Intake Start Date'),
    ('State Application Submitted Date'),
    ('Completeness Review Due Date'),
    ('Application Intake Completion Date'),
    ('Completeness Start Date'),
    ('State Application Deemed Complete'),
    ('Federal Comment Period Start Date'),
    ('Federal Comment Period End Date'),
    ('Completeness Completion Date'),
    ('SDG Preparation Start Date'),
    ('Expected Approval Date'),
    ('SME Review Date'),
    ('FRT Initial Meeting Date'),
    ('BNPMT Initial Meeting Date'),
    ('SDG Preparation Completion Date'),
    ('OGC & OMB Review Start Date'),
    ('OGC Review Complete'),
    ('OMB Review Complete'),
    ('PO & OGD Sign-Off'),
    ('OGC & OMB Review Completion Date');

INSERT INTO
    demos_app.phase_date_type
VALUES
    ('Concept', 'Concept Start Date'),
    ('Concept', 'Pre-Submission Submitted Date'),
    ('Concept', 'Concept Completion Date'),
    ('Application Intake', 'Application Intake Start Date'),
    ('Application Intake', 'State Application Submitted Date'),
    ('Application Intake', 'Completeness Review Due Date'),
    ('Application Intake', 'Application Intake Completion Date'),
    ('Completeness', 'Completeness Start Date'),
    ('Completeness', 'Completeness Review Due Date'),
    ('Completeness', 'State Application Deemed Complete'),
    ('Completeness', 'Federal Comment Period Start Date'),
    ('Completeness', 'Federal Comment Period End Date'),
    ('Completeness', 'Completeness Completion Date'),
    ('Federal Comment', 'Federal Comment Period Start Date'),
    ('Federal Comment', 'Federal Comment Period End Date'),
    ('SDG Preparation', 'SDG Preparation Start Date'),
    ('SDG Preparation', 'Expected Approval Date'),
    ('SDG Preparation', 'SME Review Date'),
    ('SDG Preparation', 'FRT Initial Meeting Date'),
    ('SDG Preparation', 'BNPMT Initial Meeting Date'),
    ('SDG Preparation', 'SDG Preparation Completion Date'),
    ('OGC & OMB Review', 'OGC & OMB Review Start Date'),
    ('OGC & OMB Review', 'OGC Review Complete'),
    ('OGC & OMB Review', 'OMB Review Complete'),
    ('OGC & OMB Review', 'PO & OGD Sign-Off'),
    ('OGC & OMB Review', 'OGC & OMB Review Completion Date');

INSERT INTO
    demos_app.state
VALUES
    ('AL', 'Alabama'),
    ('AK', 'Alaska'),
    ('AZ', 'Arizona'),
    ('AR', 'Arkansas'),
    ('CA', 'California'),
    ('CO', 'Colorado'),
    ('CT', 'Connecticut'),
    ('DE', 'Delaware'),
    ('FL', 'Florida'),
    ('GA', 'Georgia'),
    ('HI', 'Hawaii'),
    ('ID', 'Idaho'),
    ('IL', 'Illinois'),
    ('IN', 'Indiana'),
    ('IA', 'Iowa'),
    ('KS', 'Kansas'),
    ('KY', 'Kentucky'),
    ('LA', 'Louisiana'),
    ('ME', 'Maine'),
    ('MD', 'Maryland'),
    ('MA', 'Massachusetts'),
    ('MI', 'Michigan'),
    ('MN', 'Minnesota'),
    ('MS', 'Mississippi'),
    ('MO', 'Missouri'),
    ('MT', 'Montana'),
    ('NE', 'Nebraska'),
    ('NV', 'Nevada'),
    ('NH', 'New Hampshire'),
    ('NJ', 'New Jersey'),
    ('NM', 'New Mexico'),
    ('NY', 'New York'),
    ('NC', 'North Carolina'),
    ('ND', 'North Dakota'),
    ('OH', 'Ohio'),
    ('OK', 'Oklahoma'),
    ('OR', 'Oregon'),
    ('PA', 'Pennsylvania'),
    ('RI', 'Rhode Island'),
    ('SC', 'South Carolina'),
    ('SD', 'South Dakota'),
    ('TN', 'Tennessee'),
    ('TX', 'Texas'),
    ('UT', 'Utah'),
    ('VT', 'Vermont'),
    ('VA', 'Virginia'),
    ('WA', 'Washington'),
    ('WV', 'West Virginia'),
    ('WI', 'Wisconsin'),
    ('WY', 'Wyoming'),
    ('AS', 'American Samoa'),
    ('DC', 'District of Columbia'),
    ('GU', 'Guam'),
    ('MP', 'Northern Mariana Islands'),
    ('PR', 'Puerto Rico'),
    ('VI', 'Virgin Islands');

INSERT INTO
    demos_app.event_type
VALUES
-- Authentication
    ('Login Succeeded'),
    ('Logout Succeeded'),
-- Record Creation
    ('Create Demonstration Succeeded'),
    ('Create Demonstration Failed'),
    ('Create Extension Succeeded'),
    ('Create Extension Failed'),
    ('Create Amendment Succeeded'),
    ('Create Amendment Failed'),
-- Editing
    ('Edit Demonstration Succeeded'),
    ('Edit Demonstration Failed'),
-- Deletion
    ('Delete Demonstration Succeeded'),
    ('Delete Demonstration Failed'),
    ('Delete Document Succeeded'),
    ('Delete Document Failed');

INSERT INTO
    demos_app.log_level
VALUES
    ('emerg', 'Emergency', 0),
    ('alert', 'Alert', 1),
    ('crit', 'Critical', 2),
    ('err', 'Error', 3),
    ('warning', 'Warning', 4),
    ('notice', 'Notice', 5),
    ('info', 'Informational', 6),
    ('debug', 'Debug', 7);

-- Add Checks
ALTER TABLE demos_app.amendment ADD CONSTRAINT check_non_empty_name CHECK (trim(name) != '');
ALTER TABLE demos_app.amendment ADD CONSTRAINT effective_date_check CHECK (effective_date < expiration_date);
ALTER TABLE demos_app.demonstration ADD CONSTRAINT check_non_empty_name CHECK (trim(name) != '');
ALTER TABLE demos_app.demonstration ADD CONSTRAINT effective_date_check CHECK (effective_date < expiration_date);
ALTER TABLE demos_app.extension ADD CONSTRAINT check_non_empty_name CHECK (trim(name) != '');
ALTER TABLE demos_app.extension ADD CONSTRAINT effective_date_check CHECK (effective_date < expiration_date);
ALTER TABLE demos_app.document ADD CONSTRAINT check_non_empty_name CHECK (trim(name) != '');
ALTER TABLE demos_app.document ADD CONSTRAINT check_non_empty_description CHECK (trim(description) != '');
ALTER TABLE demos_app.document ADD CONSTRAINT check_non_empty_s3_path CHECK (trim(s3_path) != '');
ALTER TABLE demos_app.document ADD CONSTRAINT check_s3_path_start CHECK (s3_path ~ '^s3://');

-- Fix Deferrable Constraints
ALTER TABLE demos_app.amendment DROP CONSTRAINT amendment_id_application_type_id_fkey;
ALTER TABLE demos_app.demonstration DROP CONSTRAINT demonstration_id_application_type_id_fkey;
ALTER TABLE demos_app.extension DROP CONSTRAINT extension_id_application_type_id_fkey;

ALTER TABLE demos_app.amendment
ADD CONSTRAINT amendment_id_application_type_id_fkey
FOREIGN KEY (id, application_type_id)
REFERENCES demos_app.application(id, application_type_id)
ON DELETE NO ACTION
ON UPDATE CASCADE
DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE demos_app.demonstration
ADD CONSTRAINT demonstration_id_application_type_id_fkey
FOREIGN KEY (id, application_type_id)
REFERENCES demos_app.application(id, application_type_id)
ON DELETE NO ACTION
ON UPDATE CASCADE
DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE demos_app.extension
ADD CONSTRAINT extension_id_application_type_id_fkey
FOREIGN KEY (id, application_type_id)
REFERENCES demos_app.application(id, application_type_id)
ON DELETE NO ACTION
ON UPDATE CASCADE
DEFERRABLE INITIALLY DEFERRED;
