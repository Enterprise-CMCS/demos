-- Simple Static Values (not depending on other tables)
-- Sorted by: table name
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
    demos_app.application_tag_suggestion_status
VALUES
    ('Pending'),
    ('Accepted'),
    ('Replaced'),
    ('Removed');

INSERT INTO
    demos_app.application_type
VALUES
    ('Demonstration'),
    ('Amendment'),
    ('Extension');

INSERT INTO
    demos_app.approved_application_status_limit
VALUES
    ('Approved');

INSERT INTO
    demos_app.budget_neutrality_validation_status
VALUES
    ('Succeeded'),
    ('Failed'),
    ('Pending'),
    ('In Progress');

INSERT INTO
    demos_app.clearance_level
VALUES
    ('COMMs'),
    ('CMS (OSORA)');

INSERT INTO
    demos_app.date_type
VALUES
    ('Concept Start Date'),
    ('Concept Paper Submitted Date'),
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
    ('SME Initial Review Date'),
    ('FRT Initial Meeting Date'),
    ('BNPMT Initial Meeting Date'),
    ('SDG Preparation Completion Date'),
    ('Review Start Date'),
    ('Review Completion Date'),
    ('Concept Skipped Date'),
    ('Approval Package Start Date'),
    ('Approval Package Completion Date'),
    ('OGD Approval to Share with SMEs'),
    ('Draft Approval Package to Prep'),
    ('DDME Approval Received'),
    ('State Concurrence'),
    ('BN PMT Approval to Send to OMB'),
    ('Draft Approval Package Shared'),
    ('Receive OMB Concurrence'),
    ('Receive OGC Legal Clearance'),
    ('Package Sent for COMMs Clearance'),
    ('COMMs Clearance Received'),
    ('Submit Approval Package to OSORA'),
    ('OSORA R1 Comments Due'),
    ('OSORA R2 Comments Due'),
    ('CMS (OSORA) Clearance End'),
    ('Approval Summary Start Date'),
    ('Approval Summary Completion Date'),
    ('Application Details Marked Complete Date'),
    ('Application Demonstration Types Marked Complete Date'),
    ('Application Approval Date');

INSERT INTO
    demos_app.deliverable_action_type
VALUES
    ('Created Deliverable Slot', FALSE, FALSE, TRUE, TRUE),
    ('Marked as Past Due', FALSE, FALSE, FALSE, TRUE),
    ('Requested Extension', FALSE, TRUE, TRUE, FALSE),
    ('Approved Extension Request', TRUE, FALSE, TRUE, FALSE),
    ('Denied Extension Request', FALSE, TRUE, TRUE, FALSE),
    ('Withdrew Extension Request', FALSE, FALSE, TRUE, FALSE),
    ('Manually Changed Due Date', TRUE, TRUE, TRUE, TRUE),
    ('Requested Resubmission', TRUE, TRUE, TRUE, TRUE),
    ('Submitted Deliverable', FALSE, FALSE, TRUE, TRUE),
    ('Started Review', FALSE, FALSE, TRUE, TRUE),
    ('Accepted Deliverable', FALSE, FALSE, TRUE, TRUE),
    ('Approved Deliverable', FALSE, FALSE, TRUE, TRUE),
    ('Received and Filed Deliverable', FALSE, FALSE, TRUE, TRUE),
    ('Deleted Deliverable', FALSE, FALSE, TRUE, TRUE),
    ('Migrated Deliverable From PMDA', FALSE, FALSE, FALSE, TRUE);


INSERT INTO
    demos_app.deliverable_due_date_type
VALUES
    ('Normal'),
    ('Open Ended');

INSERT INTO
    demos_app.deliverable_extension_reason_code
VALUES
    ('COVID-19'),
    ('Technical Difficulties'),
    ('Other');

INSERT INTO
    demos_app.deliverable_extension_status
VALUES
    ('Requested'),
    ('Approved'),
    ('Denied'),
    ('Withdrawn');

INSERT INTO
    demos_app.deliverable_status
VALUES
    ('Upcoming'),
    ('Past Due'),
    ('Submitted'),
    ('Under CMS Review'),
    ('Accepted'),
    ('Approved'),
    ('Received and Filed'),
    ('Deleted');

INSERT INTO
    demos_app.deliverable_type
VALUES
    ('Annual Budget Neutrality Report'),
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
    ('Quarterly Budget Neutrality Report'),
    ('Summative Evaluation Report'),
    ('Transition Plan');

INSERT INTO
    demos_app.document_type
VALUES
    ('Application Completeness Letter'),
    ('Approval Letter'),
    ('BN Template'),
    ('BN Workbook'),
    ('Close Out Report'),
    ('Demonstration-Specific Deliverable'),
    ('Evaluation Design'),
    ('Federal Comment Internal Analysis Document'),
    ('Final Budget Neutrality Formulation Workbook'),
    ('Formal OMB Policy Concurrence Email'),
    ('General File'),
    ('HCBS Actual and Estimated Enrollment Number Report (1915(i)-like)'),
    ('HCBS Deficiency, Remediation and A/N/E Incident Report (1915(c)-like)'),
    ('HCBS Evidentiary Report'),
    ('HCBS Performance Measures Report'),
    ('HCBS Quality Improvement Strategy Report'),
    ('Implementation Plan'),
    ('Interim Evaluation Report'),
    ('Internal Completeness Review Form'),
    ('Mid-point Assessment'),
    ('Monitoring Protocol'),
    ('Monitoring Report'),
    ('Payment Ratio Analysis'),
    ('Pre-Submission'),
    ('Q&A'),
    ('Signed Decision Memo'),
    ('Special Terms & Conditions'),
    ('State Application'),
    ('Summative Evaluation Report'),
    ('Transition Plan');

INSERT INTO
    demos_app.grant_level
VALUES
    ('System'),
    ('Demonstration');

INSERT INTO
    demos_app.note_type
VALUES
    ('PO and OGD'),
    ('OGC and OMB'),
    ('COMMs Clearance'),
    ('CMS (OSORA) Clearance');

INSERT INTO
    demos_app.person_type
VALUES
    ('demos-admin'),
    ('demos-cms-user'),
    ('demos-state-user'),
    ('non-user-contact');

INSERT INTO
    demos_app.phase
VALUES
    ('Concept', 1),
    ('Application Intake', 2),
    ('Completeness', 3),
    ('Federal Comment', 4),
    ('SDG Preparation', 5),
    ('Review', 6),
    ('Approval Package', 7),
    ('Approval Summary', 8);

INSERT INTO
    demos_app.phase_status
VALUES
    ('Not Started'),
    ('Started'),
    ('Completed'),
    ('Incomplete'),
    ('Skipped');

INSERT INTO
    demos_app.reference_configuration_status
VALUES
    ('Active'),
    ('Inactive');

INSERT INTO
    demos_app.sdg_division
VALUES
    ('Division of System Reform Demonstrations'),
    ('Division of Eligibility and Coverage Demonstrations');

INSERT INTO
    demos_app.signature_level
VALUES
    ('OA'),
    ('OCD'),
    ('OGD');

INSERT INTO
    demos_app.state
VALUES
	('AL', 'Alabama', 4),
	('AK', 'Alaska', 10),
	('AS', 'American Samoa', 9),
	('AZ', 'Arizona', 9),
	('AR', 'Arkansas', 6),
	('CA', 'California', 9),
	('CO', 'Colorado', 8),
	('CT', 'Connecticut', 1),
	('DE', 'Delaware', 3),
	('DC', 'District of Columbia', 3),
	('FM', 'Federated States of Micronesia', 9),
	('FL', 'Florida', 4),
	('GA', 'Georgia', 4),
	('GU', 'Guam', 9),
	('HI', 'Hawaii', 9),
	('ID', 'Idaho', 10),
	('IL', 'Illinois', 5),
	('IN', 'Indiana', 5),
	('IA', 'Iowa', 7),
	('KS', 'Kansas', 7),
	('KY', 'Kentucky', 4),
	('LA', 'Louisiana', 6),
	('ME', 'Maine', 1),
	('MD', 'Maryland', 3),
	('MA', 'Massachusetts', 1),
	('MI', 'Michigan', 5),
	('MN', 'Minnesota', 5),
	('MS', 'Mississippi', 4),
	('MO', 'Missouri', 7),
	('MT', 'Montana', 8),
	('NE', 'Nebraska', 7),
	('NV', 'Nevada', 9),
	('NH', 'New Hampshire', 1),
	('NJ', 'New Jersey', 2),
	('NM', 'New Mexico', 6),
	('NY', 'New York', 2),
	('NC', 'North Carolina', 4),
	('ND', 'North Dakota', 8),
	('MP', 'Northern Mariana Islands', 9),
	('OH', 'Ohio', 5),
	('OK', 'Oklahoma', 6),
	('OR', 'Oregon', 10),
	('PA', 'Pennsylvania', 3),
	('PR', 'Puerto Rico', 2),
	('PW', 'Republic of Palau', 9),
	('MH', 'Republic of the Marshall Islands', 9),
	('RI', 'Rhode Island', 1),
	('SC', 'South Carolina', 4),
	('SD', 'South Dakota', 8),
	('TN', 'Tennessee', 4),
	('TX', 'Texas', 6),
	('UT', 'Utah', 8),
	('VT', 'Vermont', 1),
	('VA', 'Virginia', 3),
	('VI', 'US Virgin Islands', 2),
	('WA', 'Washington', 10),
	('WV', 'West Virginia', 3),
	('WI', 'Wisconsin', 5),
	('WY', 'Wyoming', 8);

INSERT INTO
    demos_app.tag_name
VALUES
    ('Aggregate Cap', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Annual Limits', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Basic Health Plan (BHP)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Behavioral Health', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Beneficiary Engagement', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Children''s Health Insurance Program (CHIP)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('CMMI - AHEAD', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('CMMI - Integrated Care for Kids (IncK)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('CMMI - Maternal Opioid Misuse (MOM)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Community Engagement', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Contingency Management', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Continuous Eligibility', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Delivery System Reform Incentive Payment (DSRIP)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Dental', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Designated State Health Programs (DSHP)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Employment Supports', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Enrollment Cap', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('End-Stage Renal Disease (ESRD)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Expenditure Cap', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Former Foster Care Youth (FFCY)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Global Payment Program (GPP)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Health Equity', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Health-Related Social Needs (HRSN)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Healthy Behavior Incentives', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('HIV', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Home Community Based Services (HCBS)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Lead Exposure', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Lifetime Limits', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Long-Term Services and Supports (LTSS)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Managed Care', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Marketplace Coverage/Premium Assistance Wrap', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('New Adult Group Expansion', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Non-Eligibility Period', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Non-Emergency Medical Transportation (NEMT)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Partial Expansion of the New Adult Group', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Pharmacy', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('PHE-Appendix K', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('PHE-COVID-19', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('PHE-Reasonable Opportunity Period (ROP)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('PHE-Risk Mitigation', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('PHE-Vaccine Coverage', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Premium Assistance/Employer-Sponsored Health Insurance (ESI)/Qualified Health Plan (QHP)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Premiums/Cost-Sharing', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Provider Cap', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Provider Restriction', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('ReEntry', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Reproductive Health: Family Planning', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Reproductive Health: Fertility', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Reproductive Health: Hyde', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Reproductive Health: Maternal Health', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Reproductive Health: Post-Partum Extension', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Reproductive Health: RAD', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Retroactive Eligibility', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Serious Mental Illness (SMI)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Special Needs', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Substance Use Disorder (SUD)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Targeted Population Expansion', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Tribal', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Uncompensated Care', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Value Based Care (VBC)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Vision', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('FAQ', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO
    demos_app.tag_source
VALUES
    ('User'),
    ('System');

INSERT INTO
    demos_app.tag_status
VALUES
    ('Unapproved'),
    ('Approved');

INSERT INTO
    demos_app.tag_type
VALUES
    ('Application'),
    ('Demonstration Type'),
    ('Reference');

INSERT INTO
    demos_app.reference_tag_type_limit
VALUES
    ('Reference');

INSERT INTO
    demos_app.uipath_result_status
VALUES
    ('Pending'),
    ('Finished'),
    ('Failed');

-- Complex Static Values (depending on other tables existing)
-- Sorted by: table name
INSERT INTO
    demos_app.deliverable_action_configuration
VALUES
    ('Created Deliverable Slot', 'Upcoming', 'Upcoming'),

    ('Marked as Past Due', 'Upcoming', 'Past Due'),

    ('Requested Extension', 'Upcoming', 'Upcoming'),
    ('Requested Extension', 'Past Due', 'Past Due'),

    ('Approved Extension Request', 'Upcoming', 'Upcoming'),
    ('Approved Extension Request', 'Past Due', 'Upcoming'),
    ('Approved Extension Request', 'Submitted', 'Submitted'),
    ('Approved Extension Request', 'Under CMS Review', 'Under CMS Review'),

    ('Denied Extension Request', 'Upcoming', 'Upcoming'),
    ('Denied Extension Request', 'Past Due', 'Past Due'),
    ('Denied Extension Request', 'Submitted', 'Submitted'),
    ('Denied Extension Request', 'Under CMS Review', 'Under CMS Review'),

    ('Withdrew Extension Request', 'Upcoming', 'Upcoming'),
    ('Withdrew Extension Request', 'Past Due', 'Past Due'),
    ('Withdrew Extension Request', 'Submitted', 'Submitted'),
    ('Withdrew Extension Request', 'Under CMS Review', 'Under CMS Review'),

    ('Manually Changed Due Date', 'Upcoming', 'Upcoming'),
    ('Manually Changed Due Date', 'Past Due', 'Upcoming'),
    ('Manually Changed Due Date', 'Submitted', 'Submitted'),
    ('Manually Changed Due Date', 'Under CMS Review', 'Under CMS Review'),

    ('Requested Resubmission', 'Submitted', 'Upcoming'),
    ('Requested Resubmission', 'Under CMS Review', 'Upcoming'),

    ('Submitted Deliverable', 'Upcoming', 'Submitted'),
    ('Submitted Deliverable', 'Past Due', 'Submitted'),
    ('Submitted Deliverable', 'Submitted', 'Submitted'),
    ('Submitted Deliverable', 'Under CMS Review', 'Submitted'),

    ('Started Review', 'Submitted', 'Under CMS Review'),

    ('Accepted Deliverable', 'Under CMS Review', 'Accepted'),

    ('Approved Deliverable', 'Under CMS Review', 'Approved'),

    ('Received and Filed Deliverable', 'Under CMS Review', 'Received and Filed'),

    ('Deleted Deliverable', 'Upcoming', 'Deleted'),
    ('Deleted Deliverable', 'Past Due', 'Deleted'),

    ('Migrated Deliverable From PMDA', 'Upcoming', 'Upcoming'),
    ('Migrated Deliverable From PMDA', 'Past Due', 'Past Due'),
    ('Migrated Deliverable From PMDA', 'Submitted', 'Submitted'),
    ('Migrated Deliverable From PMDA', 'Under CMS Review', 'Under CMS Review'),
    ('Migrated Deliverable From PMDA', 'Accepted', 'Accepted'),
    ('Migrated Deliverable From PMDA', 'Approved', 'Approved'),
    ('Migrated Deliverable From PMDA', 'Received and Filed', 'Received and Filed'),
    ('Migrated Deliverable From PMDA', 'Deleted', 'Deleted');

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

INSERT INTO
    demos_app.on_demand_report_status
VALUES
    ('Available');

INSERT INTO
    demos_app.on_demand_report_type
VALUES
    ('Basic Test Report'),
    ('Deliverable Status Report'),
    ('Application Details Report'),
    ('Demonstration Overview Report'),
    ('Demonstration Types Report');

INSERT INTO
    demos_app.phase_date_type
VALUES
    ('Concept', 'Concept Start Date'),
    ('Concept', 'Concept Paper Submitted Date'),
    ('Concept', 'Concept Completion Date'),
    ('Concept', 'Concept Skipped Date'),
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
    ('SDG Preparation', 'SME Initial Review Date'),
    ('SDG Preparation', 'FRT Initial Meeting Date'),
    ('SDG Preparation', 'BNPMT Initial Meeting Date'),
    ('SDG Preparation', 'SDG Preparation Completion Date'),
    ('Review', 'Review Start Date'),
    ('Review', 'Review Completion Date'),
    ('Review', 'OGD Approval to Share with SMEs'),
    ('Review', 'Draft Approval Package to Prep'),
    ('Review', 'DDME Approval Received'),
    ('Review', 'State Concurrence'),
    ('Review', 'BN PMT Approval to Send to OMB'),
    ('Review', 'Draft Approval Package Shared'),
    ('Review', 'Receive OMB Concurrence'),
    ('Review', 'Receive OGC Legal Clearance'),
    ('Review', 'Package Sent for COMMs Clearance'),
    ('Review', 'COMMs Clearance Received'),
    ('Review', 'Submit Approval Package to OSORA'),
    ('Review', 'OSORA R1 Comments Due'),
    ('Review', 'OSORA R2 Comments Due'),
    ('Review', 'CMS (OSORA) Clearance End'),
    ('Approval Package', 'Approval Package Start Date'),
    ('Approval Package', 'Approval Package Completion Date'),
    ('Approval Summary', 'Application Details Marked Complete Date'),
    ('Approval Summary', 'Application Demonstration Types Marked Complete Date'),
    ('Approval Summary', 'Approval Summary Start Date'),
    ('Approval Summary', 'Approval Summary Completion Date'),
    ('Approval Summary', 'Application Approval Date');

INSERT INTO
    demos_app.phase_document_type
VALUES
    -- General File is allowed for almost all phases
    ('Concept', 'General File'),
    ('Application Intake', 'General File'),
    ('Completeness', 'General File'),
    ('Federal Comment', 'General File'),
    ('SDG Preparation', 'General File'),
    ('Review', 'General File'),
    ('Approval Summary', 'General File'),

    -- Now, add phase-specific documents
    ('Concept', 'Pre-Submission'),
    ('Application Intake', 'State Application'),
    ('Completeness', 'Internal Completeness Review Form'),
    ('Completeness', 'Application Completeness Letter'),
    ('Federal Comment', 'Federal Comment Internal Analysis Document'),
    ('Approval Package', 'Approval Letter'),
    ('Approval Package', 'Final Budget Neutrality Formulation Workbook'),
    ('Approval Package', 'Formal OMB Policy Concurrence Email'),
    ('Approval Package', 'Q&A'),
    ('Approval Package', 'Signed Decision Memo'),
    ('Approval Package', 'Special Terms & Conditions');

INSERT INTO
    demos_app.phase_note_type
VALUES
    ('Review', 'PO and OGD'),
    ('Review', 'OGC and OMB'),
    ('Review', 'COMMs Clearance'),
    ('Review', 'CMS (OSORA) Clearance');

INSERT INTO
    demos_app.phase_phase_status
VALUES
    -- All phases can be Not Started except Concept (new applications begin in Started)
    ('Application Intake', 'Not Started'),
    ('Completeness', 'Not Started'),
    ('Federal Comment', 'Not Started'),
    ('SDG Preparation', 'Not Started'),
    ('Review', 'Not Started'),
    ('Approval Package', 'Not Started'),
    ('Approval Summary', 'Not Started'),

    -- All phases can be Started
    ('Concept', 'Started'),
    ('Application Intake', 'Started'),
    ('Completeness', 'Started'),
    ('Federal Comment', 'Started'),
    ('SDG Preparation', 'Started'),
    ('Review', 'Started'),
    ('Approval Package', 'Started'),
    ('Approval Summary', 'Started'),

    -- All phases can be Completed
    ('Concept', 'Completed'),
    ('Application Intake', 'Completed'),
    ('Completeness', 'Completed'),
    ('Federal Comment', 'Completed'),
    ('SDG Preparation', 'Completed'),
    ('Review', 'Completed'),
    ('Approval Package', 'Completed'),
    ('Approval Summary', 'Completed'),

    -- Special cases
    ('Concept', 'Skipped'),
    ('Completeness', 'Incomplete');

INSERT INTO
    demos_app.permission
VALUES
    -- Row Level Permissions
    ('View All Demonstrations', 'System'),
    ('View Assigned Demonstrations', 'System'),
    ('View All Amendments', 'System'),
    ('View Amendments on Assigned Demonstrations', 'System'),
    ('View All Extensions', 'System'),
    ('View Extensions on Assigned Demonstrations', 'System'),
    ('View All Documents', 'System'),
    ('View All Deliverables', 'System'),
    ('View Deliverables on Assigned Demonstrations', 'System'),
    ('View All DemonstrationRoleAssignments', 'System'),
    ('View DemonstrationRoleAssignments on Assigned Demonstrations', 'System'),
    ('View Documents on Assigned Deliverables', 'System'),
    ('Edit All Documents', 'System'),
    ('Edit State Documents on Assigned Deliverables', 'System'),
    ('Delete All Documents', 'System'),
    ('Delete State Documents on Assigned Deliverables', 'System'),

    -- Field Level Permissions
    ('Access Admin Field', 'System'),
    ('Access Admin Query', 'System'),
    ('Perform Admin Action', 'System'),
    ('Access CMS Field', 'System'),
    ('Access CMS Query', 'System'),
    ('Perform CMS Action', 'System'),
    ('Perform State Action', 'System');

INSERT INTO
    demos_app.role
VALUES
    ('Project Officer', 'Demonstration'),
    ('State Point of Contact', 'Demonstration'),
    ('DDME Analyst', 'Demonstration'),
    ('Policy Technical Director', 'Demonstration'),
    ('Monitoring & Evaluation Technical Director', 'Demonstration'),
    ('Admin User', 'System'),
    ('CMS User', 'System'),
    ('State User', 'System');

INSERT INTO
    demos_app.role_permission
VALUES
    ('Admin User', 'System', 'View All Demonstrations'),
    ('Admin User', 'System', 'View Assigned Demonstrations'),
    ('CMS User', 'System', 'View All Demonstrations'),
    ('CMS User', 'System', 'View Assigned Demonstrations'),
    ('State User', 'System', 'View Assigned Demonstrations'),
    ('Admin User', 'System', 'View All Amendments'),
    ('Admin User', 'System', 'View Amendments on Assigned Demonstrations'),
    ('CMS User', 'System', 'View All Amendments'),
    ('CMS User', 'System', 'View Amendments on Assigned Demonstrations'),
    ('State User', 'System', 'View Amendments on Assigned Demonstrations'),
    ('Admin User', 'System', 'View All Extensions'),
    ('Admin User', 'System', 'View Extensions on Assigned Demonstrations'),
    ('CMS User', 'System', 'View All Extensions'),
    ('CMS User', 'System', 'View Extensions on Assigned Demonstrations'),
    ('State User', 'System', 'View Extensions on Assigned Demonstrations'),
    ('Admin User', 'System', 'View All Documents'),
    ('CMS User', 'System', 'View All Documents'),
    ('Admin User', 'System', 'View All Deliverables'),
    ('Admin User', 'System', 'View Deliverables on Assigned Demonstrations'),
    ('CMS User', 'System', 'View All Deliverables'),
    ('CMS User', 'System', 'View Deliverables on Assigned Demonstrations'),
    ('State User', 'System', 'View Deliverables on Assigned Demonstrations'),
    ('Admin User', 'System', 'Access CMS Field'),
    ('Admin User', 'System', 'Access CMS Query'),
    ('Admin User', 'System', 'Perform CMS Action'),
    ('Admin User', 'System', 'Perform State Action'),
    ('CMS User', 'System', 'Access CMS Field'),
    ('CMS User', 'System', 'Access CMS Query'),
    ('CMS User', 'System', 'Perform CMS Action'),
    ('State User', 'System', 'Perform State Action'),
    ('Admin User', 'System', 'View All DemonstrationRoleAssignments'),
    ('Admin User', 'System', 'View DemonstrationRoleAssignments on Assigned Demonstrations'),
    ('CMS User', 'System', 'View All DemonstrationRoleAssignments'),
    ('CMS User', 'System', 'View DemonstrationRoleAssignments on Assigned Demonstrations'),
    ('State User', 'System', 'View DemonstrationRoleAssignments on Assigned Demonstrations'),
    ('Admin User', 'System', 'View Documents on Assigned Deliverables'),
    ('Admin User', 'System', 'Edit All Documents'),
    ('Admin User', 'System', 'Edit State Documents on Assigned Deliverables'),
    ('Admin User', 'System', 'Delete All Documents'),
    ('Admin User', 'System', 'Delete State Documents on Assigned Deliverables'),
    ('CMS User', 'System', 'View Documents on Assigned Deliverables'),
    ('CMS User', 'System', 'Edit All Documents'),
    ('CMS User', 'System', 'Edit State Documents on Assigned Deliverables'),
    ('CMS User', 'System', 'Delete All Documents'),
    ('CMS User', 'System', 'Delete State Documents on Assigned Deliverables'),
    ('State User', 'System', 'View Documents on Assigned Deliverables'),
    ('State User', 'System', 'Edit State Documents on Assigned Deliverables'),
    ('State User', 'System', 'Delete State Documents on Assigned Deliverables'),
    ('Admin User', 'System', 'Access Admin Field'),
    ('Admin User', 'System', 'Access Admin Query'),
    ('Admin User', 'System', 'Perform Admin Action');

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
    ('Admin User', 'demos-admin'),
    ('CMS User', 'demos-cms-user'),
    ('State User', 'demos-state-user');

INSERT INTO
    demos_app.tag
VALUES
    ('Aggregate Cap', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Annual Limits', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Basic Health Plan (BHP)', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Behavioral Health', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Beneficiary Engagement', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Children''s Health Insurance Program (CHIP)', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('CMMI - AHEAD', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('CMMI - Integrated Care for Kids (IncK)', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('CMMI - Maternal Opioid Misuse (MOM)', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Community Engagement', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Contingency Management', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Continuous Eligibility', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Delivery System Reform Incentive Payment (DSRIP)', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Dental', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Designated State Health Programs (DSHP)', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Employment Supports', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Enrollment Cap', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('End-Stage Renal Disease (ESRD)', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Expenditure Cap', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Former Foster Care Youth (FFCY)', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Global Payment Program (GPP)', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Health Equity', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Health-Related Social Needs (HRSN)', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Healthy Behavior Incentives', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('HIV', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Home Community Based Services (HCBS)', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Lead Exposure', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Lifetime Limits', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Long-Term Services and Supports (LTSS)', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Managed Care', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Marketplace Coverage/Premium Assistance Wrap', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('New Adult Group Expansion', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Non-Eligibility Period', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Non-Emergency Medical Transportation (NEMT)', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Partial Expansion of the New Adult Group', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Pharmacy', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('PHE-Appendix K', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('PHE-COVID-19', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('PHE-Reasonable Opportunity Period (ROP)', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('PHE-Risk Mitigation', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('PHE-Vaccine Coverage', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Premium Assistance/Employer-Sponsored Health Insurance (ESI)/Qualified Health Plan (QHP)', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Premiums/Cost-Sharing', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Provider Cap', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Provider Restriction', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('ReEntry', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Reproductive Health: Family Planning', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Reproductive Health: Fertility', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Reproductive Health: Hyde', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Reproductive Health: Maternal Health', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Reproductive Health: Post-Partum Extension', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Reproductive Health: RAD', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Retroactive Eligibility', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Serious Mental Illness (SMI)', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Special Needs', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Substance Use Disorder (SUD)', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Targeted Population Expansion', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Tribal', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Uncompensated Care', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Value Based Care (VBC)', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Vision', 'Application', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Aggregate Cap', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Annual Limits', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Basic Health Plan (BHP)', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Behavioral Health', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Beneficiary Engagement', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Children''s Health Insurance Program (CHIP)', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('CMMI - AHEAD', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('CMMI - Integrated Care for Kids (IncK)', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('CMMI - Maternal Opioid Misuse (MOM)', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Community Engagement', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Contingency Management', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Continuous Eligibility', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Delivery System Reform Incentive Payment (DSRIP)', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Dental', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Designated State Health Programs (DSHP)', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Employment Supports', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Enrollment Cap', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('End-Stage Renal Disease (ESRD)', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Expenditure Cap', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Former Foster Care Youth (FFCY)', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Global Payment Program (GPP)', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Health Equity', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Health-Related Social Needs (HRSN)', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Healthy Behavior Incentives', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('HIV', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Home Community Based Services (HCBS)', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Lead Exposure', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Lifetime Limits', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Long-Term Services and Supports (LTSS)', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Managed Care', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Marketplace Coverage/Premium Assistance Wrap', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('New Adult Group Expansion', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Non-Eligibility Period', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Non-Emergency Medical Transportation (NEMT)', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Partial Expansion of the New Adult Group', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Pharmacy', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('PHE-Appendix K', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('PHE-COVID-19', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('PHE-Reasonable Opportunity Period (ROP)', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('PHE-Risk Mitigation', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('PHE-Vaccine Coverage', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Premium Assistance/Employer-Sponsored Health Insurance (ESI)/Qualified Health Plan (QHP)', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Premiums/Cost-Sharing', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Provider Cap', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Provider Restriction', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('ReEntry', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Reproductive Health: Family Planning', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Reproductive Health: Fertility', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Reproductive Health: Hyde', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Reproductive Health: Maternal Health', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Reproductive Health: Post-Partum Extension', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Reproductive Health: RAD', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Retroactive Eligibility', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Serious Mental Illness (SMI)', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Special Needs', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Substance Use Disorder (SUD)', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Targeted Population Expansion', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Tribal', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Uncompensated Care', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Value Based Care (VBC)', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Vision', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('FAQ', 'Reference', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Limit Tables (depending on other tables existing)
-- Sorted by: table name
INSERT INTO
    demos_app.amendment_application_type_limit
VALUES
    ('Amendment');

INSERT INTO
    demos_app.application_tag_suggestion_extract_field_limit
VALUES
    ('demo_type');

INSERT INTO
    demos_app.application_tag_type_limit
VALUES
    ('Application');

INSERT INTO
    demos_app.budget_neutrality_workbook_document_type_limit
VALUES
    ('BN Workbook');

INSERT INTO
    demos_app.cms_user_person_type_limit
VALUES
    ('demos-admin'),
    ('demos-cms-user');

INSERT INTO
    demos_app.deliverable_active_extension_status_limit
VALUES
    ('Requested');

INSERT INTO
    demos_app.deliverable_submission_action_type_limit
VALUES
    ('Submitted Deliverable');

INSERT INTO
    demos_app.demonstration_application_type_limit
VALUES
    ('Demonstration');

INSERT INTO
    demos_app.demonstration_grant_level_limit
VALUES
    ('Demonstration');

INSERT INTO
    demos_app.demonstration_type_tag_type_limit
VALUES
    ('Demonstration Type');

INSERT INTO
    demos_app.extension_application_type_limit
VALUES
    ('Extension');

INSERT INTO
    demos_app.system_grant_level_limit
VALUES
    ('System');

INSERT INTO
    demos_app.user_person_type_limit
VALUES
    ('demos-admin'),
    ('demos-cms-user'),
    ('demos-state-user');

-- Check Constraints
-- Sorted by: table name, constraint name
ALTER TABLE
    demos_app.amendment
ADD CONSTRAINT
    check_amendment_non_null_fields_when_approved
CHECK (
    NOT (
        status_id = 'Approved'
        AND (
            effective_date IS NULL
            OR signature_level_id IS NULL
        )
    )
);

ALTER TABLE
    demos_app.amendment
ADD CONSTRAINT
    check_non_empty_name
CHECK (
    trim(name) != ''
);

ALTER TABLE demos_app.amendment
ADD CONSTRAINT amendment_signature_level_check
CHECK (
  signature_level_id IS NULL
  OR signature_level_id IN ('OA', 'OCD')
);

ALTER TABLE
    demos_app.application_tag_suggestion
ADD CONSTRAINT
    check_application_tag_suggestion_non_null_replaced_value_when_replaced
CHECK (
  (
    status_id = 'Replaced'
    AND replaced_value IS NOT NULL
  ) OR (
    status_id != 'Replaced'
    AND replaced_value IS NULL
  )
);

ALTER TABLE
    demos_app.budget_neutrality_workbook
ADD CONSTRAINT
    check_budget_neutrality_workbook_non_null_fields_when_succeeded
CHECK (
    NOT (
        validation_status_id = 'Succeeded'
        AND (
            actuals IS NULL
            OR net_variance_total IS NULL           
        )
    )
);

ALTER TABLE
    demos_app.deliverable
ADD CONSTRAINT
    check_non_empty_name
CHECK (
    trim(name) != ''
);

ALTER TABLE
    demos_app.deliverable
ADD CONSTRAINT
    check_deliverable_name_has_no_leading_trailing_whitespace
CHECK (
    name = trim(name)
);

ALTER TABLE
    demos_app.deliverable_action
ADD CONSTRAINT
    block_unpermitted_due_date_changes
CHECK (
    NOT (
        due_date_change_allowed = FALSE
        AND old_due_date != new_due_date
    )
);

ALTER TABLE
    demos_app.deliverable_action
ADD CONSTRAINT
    check_non_empty_note
CHECK (
    (note IS NULL OR trim(note) != '')
);

ALTER TABLE
    demos_app.deliverable_action
ADD CONSTRAINT
    require_extension_id_for_extension_actions
CHECK (
    (extension_id_optional = TRUE) OR
    (extension_id_optional = FALSE AND active_extension_id IS NOT NULL)
);

ALTER TABLE
    demos_app.deliverable_action
ADD CONSTRAINT
    require_notes_for_user_actions
CHECK (
    (should_have_note = FALSE AND note IS NULL) OR (should_have_note = TRUE AND note IS NOT NULL)
);

ALTER TABLE
    demos_app.deliverable_action
ADD CONSTRAINT
    require_user_id_for_user_actions
CHECK (
    (should_have_user_id = FALSE AND user_id IS NULL) OR (should_have_user_id = TRUE AND user_id IS NOT NULL)
);

ALTER TABLE
    demos_app.deliverable_extension
ADD CONSTRAINT
    require_final_date_for_finished_requests
CHECK (
    (
        status_id = 'Approved'
        AND final_date_granted IS NOT NULL
    ) OR (
        status_id != 'Approved'
        AND final_date_granted IS NULL
    )
);

ALTER TABLE
    demos_app.demonstration
ADD CONSTRAINT
    check_demonstration_non_null_fields_when_approved
CHECK (
    NOT (
        status_id = 'Approved'
        AND (
            effective_date IS NULL
            OR expiration_date IS NULL
            OR sdg_division_id IS NULL
            OR signature_level_id IS NULL
        )
    )
);

ALTER TABLE
    demos_app.demonstration
ADD CONSTRAINT
    check_non_empty_name
CHECK (
    trim(name) != ''
);

ALTER TABLE
    demos_app.demonstration
ADD CONSTRAINT
    check_demonstration_name_trimmed
CHECK (
    name = trim(name)
);

ALTER TABLE
    demos_app.demonstration
ADD CONSTRAINT
    check_demonstration_description_trimmed
CHECK (
    description IS NULL
    OR description = trim(description)
);

ALTER TABLE
    demos_app.demonstration
ADD CONSTRAINT
    effective_date_check
CHECK (
    effective_date < expiration_date
);

ALTER TABLE demos_app.demonstration
ADD CONSTRAINT demonstration_signature_level_check
CHECK (
  signature_level_id IS NOT NULL
  AND signature_level_id = 'OA'
);

ALTER TABLE
    demos_app.demonstration_type_tag_assignment
ADD CONSTRAINT
    effective_date_check
CHECK (
    effective_date < expiration_date
);

ALTER TABLE
    demos_app.document
ADD CONSTRAINT
    check_deliverable_null_states
CHECK (
    (deliverable_id IS NULL
        AND deliverable_type_id IS NULL
        AND deliverable_is_cms_attached_file IS NULL
        AND deliverable_submission_action_id IS NULL
        AND deliverable_submission_action_type_id IS NULL)
    OR
    (deliverable_id IS NOT NULL
        AND deliverable_type_id IS NOT NULL
        AND deliverable_is_cms_attached_file IS NOT NULL)
);

ALTER TABLE
    demos_app.document
ADD CONSTRAINT
    check_non_empty_name
CHECK (
    trim(name) != ''
);

ALTER TABLE
    demos_app.document
ADD CONSTRAINT
    check_non_empty_s3_path
CHECK (
    trim(s3_path) != ''
);


ALTER TABLE
    demos_app.document
ADD CONSTRAINT
    check_phase_id_deliverable_id_null
CHECK (
    phase_id IS NULL OR deliverable_id IS NULL
);

ALTER TABLE
    demos_app.document
ADD CONSTRAINT
    no_submitted_deliverable_cms_files
CHECK (
    NOT (deliverable_is_cms_attached_file = true AND deliverable_submission_action_id IS NOT NULL)
);

ALTER TABLE
    demos_app.document_infected
ADD CONSTRAINT
    check_deliverable_null_states
CHECK (
    (
        deliverable_id IS NULL
        AND deliverable_type_id IS NULL
        AND deliverable_is_cms_attached_file IS NULL
    ) OR (
        deliverable_id IS NOT NULL
        AND deliverable_type_id IS NOT NULL
        AND deliverable_is_cms_attached_file IS NOT NULL
    )
);

ALTER TABLE
    demos_app.document_infected
ADD CONSTRAINT
    check_non_empty_name
CHECK (
    trim(name) != ''
);

ALTER TABLE
    demos_app.document_infected
ADD CONSTRAINT
    check_non_empty_s3_path
CHECK (
    trim(s3_path) != ''
);

ALTER TABLE
    demos_app.document_infected
ADD CONSTRAINT
    check_phase_id_deliverable_id_null
CHECK (
    phase_id IS NULL OR deliverable_id IS NULL
);

ALTER TABLE
    demos_app.document_pending_upload
ADD CONSTRAINT
    check_deliverable_null_states
CHECK (
    (deliverable_id IS NULL AND deliverable_type_id IS NULL AND deliverable_is_cms_attached_file IS NULL)
    OR
    (deliverable_id IS NOT NULL AND deliverable_type_id IS NOT NULL AND deliverable_is_cms_attached_file IS NOT NULL)
);

ALTER TABLE
    demos_app.document_pending_upload
ADD CONSTRAINT
    check_phase_id_deliverable_id_null
CHECK (
    phase_id IS NULL OR deliverable_id IS NULL
);

ALTER TABLE
    demos_app.document_pending_upload
ADD CONSTRAINT
    check_non_empty_name
CHECK (
    trim(name) != ''
);

ALTER TABLE
    demos_app.extension
ADD CONSTRAINT
    check_extension_non_null_fields_when_approved
CHECK (
    NOT (
        status_id = 'Approved'
        AND (
            effective_date IS NULL
            OR signature_level_id IS NULL
        )
    )
);

ALTER TABLE
    demos_app.extension
ADD CONSTRAINT
    check_non_empty_name
CHECK (
    trim(name) != ''
);

ALTER TABLE demos_app.extension
ADD CONSTRAINT extension_signature_level_check
CHECK (
  signature_level_id IS NULL
  OR signature_level_id IN ('OA', 'OCD')
);

ALTER TABLE
    demos_app.on_demand_report
ADD CONSTRAINT
    check_non_empty_s3_path
CHECK (
    trim(s3_path) != ''
);

ALTER TABLE
    demos_app.private_comment
ADD CONSTRAINT
    check_non_empty_content
CHECK (
    trim(content) != ''
);

ALTER TABLE
    demos_app.public_comment
ADD CONSTRAINT
    check_non_empty_content
CHECK (
    trim(content) != ''
);

ALTER TABLE
    demos_app.reference
ADD CONSTRAINT
    check_non_empty_description
CHECK (
    trim(description) != ''
);

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

ALTER TABLE
    demos_app.state
ADD CONSTRAINT
    check_region_is_valid
CHECK (
    region BETWEEN 1 AND 10
);

ALTER TABLE
    demos_app.users
ADD CONSTRAINT
    check_external_fields_exist_for_logged_in_users
CHECK (
    (
        has_logged_in
        AND (
            cognito_subject IS NOT NULL
            AND username IS NOT NULL
        )
    ) OR (
        NOT has_logged_in AND (
            cognito_subject IS NULL
            AND username IS NULL
        )
    )
);

ALTER TABLE
    demos_app.users
ADD CONSTRAINT
    check_all_regular_users_are_logged_in
CHECK (
    (NOT is_migrated_from_pmda AND has_logged_in) OR (is_migrated_from_pmda)
);

-- Deferred Keys
-- Sorted by: table name, constraint name
ALTER TABLE demos_app.amendment DROP CONSTRAINT amendment_id_application_type_id_fkey;
ALTER TABLE demos_app.amendment
ADD CONSTRAINT amendment_id_application_type_id_fkey
FOREIGN KEY (id, application_type_id)
REFERENCES demos_app.application(id, application_type_id)
ON DELETE NO ACTION
ON UPDATE CASCADE
DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE demos_app.application_tag_suggestion_extract DROP CONSTRAINT application_tag_suggestion_extract_application_id_value_fkey;
ALTER TABLE demos_app.application_tag_suggestion_extract
ADD CONSTRAINT application_tag_suggestion_extract_application_id_value_fkey
FOREIGN KEY (application_id, value)
REFERENCES demos_app.application_tag_suggestion(application_id, value)
ON DELETE NO ACTION
ON UPDATE CASCADE
DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE demos_app.budget_neutrality_workbook DROP CONSTRAINT budget_neutrality_workbook_id_document_type_id_fkey;
ALTER TABLE demos_app.budget_neutrality_workbook
ADD CONSTRAINT budget_neutrality_workbook_id_document_type_id_fkey
FOREIGN KEY (id, document_type_id)
REFERENCES demos_app.document(id, document_type_id)
ON DELETE NO ACTION
ON UPDATE CASCADE
DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE demos_app.demonstration DROP CONSTRAINT demonstration_id_application_type_id_fkey;
ALTER TABLE demos_app.demonstration
ADD CONSTRAINT demonstration_id_application_type_id_fkey
FOREIGN KEY (id, application_type_id)
REFERENCES demos_app.application(id, application_type_id)
ON DELETE NO ACTION
ON UPDATE CASCADE
DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE demos_app.extension DROP CONSTRAINT extension_id_application_type_id_fkey;
ALTER TABLE demos_app.extension
ADD CONSTRAINT extension_id_application_type_id_fkey
FOREIGN KEY (id, application_type_id)
REFERENCES demos_app.application(id, application_type_id)
ON DELETE NO ACTION
ON UPDATE CASCADE
DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE demos_app.deliverable_active_extension DROP CONSTRAINT deliverable_active_extension_deliverable_extension_id_deli_fkey;
ALTER TABLE demos_app.deliverable_active_extension
ADD CONSTRAINT deliverable_active_extension_deliverable_extension_id_deli_fkey
FOREIGN KEY (deliverable_extension_id, deliverable_id, status_id)
REFERENCES demos_app.deliverable_extension(id, deliverable_id, status_id)
ON DELETE RESTRICT
ON UPDATE NO ACTION
DEFERRABLE INITIALLY DEFERRED;

-- Partial Unique Indexes
-- Partial unique indexes are not supported yet in Prisma
-- This is manually managing it; please ensure it is not removed in future migrations
CREATE UNIQUE INDEX unique_index_on_deliverable_extension_actions
ON demos_app.deliverable_action (action_type_id, active_extension_id)
WHERE
    action_type_id IN (
        'Approved Extension Request',
        'Withdrew Extension Request',
        'Requested Extension',
        'Denied Extension Request'
    );

CREATE UNIQUE INDEX reference_configuration_unique_index_on_active_reference_id
ON demos_app.reference_configuration (reference_id)
WHERE
    status_id = 'Active';
    
-- Sequences
CREATE SEQUENCE
    demos_app.medicaid_id_number_seq
START WITH
    11000
INCREMENT BY
    1
MINVALUE
    11000
MAXVALUE
    99999
NO CYCLE;

CREATE SEQUENCE
    demos_app.chip_id_number_seq
START WITH
    1000
INCREMENT BY
    1
MINVALUE
    1000
MAXVALUE
    99999
NO CYCLE;
