SET search_path TO demos_app;

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
    ('State Application'),
    ('Special Terms & Conditions');

INSERT INTO
    demos_app.phase
VALUES
    ('None', 0),
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
    ('Review', 'General File'),
    ('Approval Package', 'General File'),
    ('Approval Summary', 'General File'),

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
    ('Approval Package', 'Signed Decision Memo'),
    ('Approval Package', 'Special Terms & Conditions');

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
    ('Application Demonstration Types Marked Complete Date');

INSERT INTO
    demos_app.phase_date_type
VALUES
    ('Concept', 'Concept Start Date'),
    ('Concept', 'Pre-Submission Submitted Date'),
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
    ('SDG Preparation', 'SME Review Date'),
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
    ('Approval Summary', 'Approval Summary Completion Date');


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
    ('Login Failed'),
    ('Logout Failed'),
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

INSERT INTO
    demos_app.application_phase_type_limit
VALUES
    ('Concept'),
    ('Application Intake'),
    ('Completeness'),
    ('Federal Comment'),
    ('SDG Preparation'),
    ('Review'),
    ('Approval Package'),
    ('Approval Summary');

-- Insert values
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
    demos_app.note_type
VALUES
    ('PO and OGD'),
    ('OGC and OMB'),
    ('COMMs Clearance'),
    ('CMS (OSORA) Clearance');

INSERT INTO
    demos_app.phase_note_type
VALUES
    ('Review', 'PO and OGD'),
    ('Review', 'OGC and OMB'),
    ('Review', 'COMMs Clearance'),
    ('Review', 'CMS (OSORA) Clearance');

INSERT INTO
    demos_app.clearance_level
VALUES
    ('COMMs'),
    ('CMS (OSORA)');

INSERT INTO
    demos_app.tag_configuration_status
VALUES
    ('Unreviewed'),
    ('Approved');

INSERT INTO
    demos_app.tag_configuration_source
VALUES
    ('User'),
    ('System');

INSERT INTO
    demos_app.tag_type
VALUES
    ('Application'),
    ('Demonstration Type');

INSERT INTO
    demos_app.application_tag_type_limit
VALUES
    ('Application');    

INSERT INTO
    demos_app.demonstration_type_tag_type_limit
VALUES
    ('Demonstration Type');

INSERT INTO
    demos_app.tag
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
    ('Vision', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO
    demos_app.tag_configuration
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
    ('Vision', 'Demonstration Type', 'System', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

 
-- Add Checks
ALTER TABLE demos_app.amendment ADD CONSTRAINT check_non_empty_name CHECK (trim(name) != '');
ALTER TABLE demos_app.demonstration ADD CONSTRAINT check_non_empty_name CHECK (trim(name) != '');
ALTER TABLE demos_app.demonstration ADD CONSTRAINT effective_date_check CHECK (effective_date < expiration_date);
ALTER TABLE demos_app.extension ADD CONSTRAINT check_non_empty_name CHECK (trim(name) != '');
ALTER TABLE demos_app.document ADD CONSTRAINT check_non_empty_name CHECK (trim(name) != '');
ALTER TABLE demos_app.document ADD CONSTRAINT check_non_empty_s3_path CHECK (trim(s3_path) != '');
ALTER TABLE demos_app.document_pending_upload ADD CONSTRAINT check_non_empty_name CHECK (trim(name) != '');
ALTER TABLE demos_app.demonstration_type_tag_assignment ADD CONSTRAINT effective_date_check CHECK (effective_date < expiration_date);
ALTER TABLE demos_app.demonstration ADD CONSTRAINT check_demonstration_non_null_fields_when_approved CHECK (
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
ALTER TABLE demos_app.amendment ADD CONSTRAINT check_amendment_non_null_fields_when_approved CHECK (
  NOT (
    status_id = 'Approved'
    AND (
      effective_date IS NULL
      OR signature_level_id IS NULL
    ) 
  )
);
ALTER TABLE demos_app.extension ADD CONSTRAINT check_extension_non_null_fields_when_approved CHECK (
  NOT (
    status_id = 'Approved'
    AND (
      effective_date IS NULL
      OR signature_level_id IS NULL
    ) 
  )
);

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
