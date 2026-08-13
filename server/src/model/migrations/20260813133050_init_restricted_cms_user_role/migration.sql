SET search_path TO demos_app;

INSERT INTO person_type VALUES ('demos-restricted-cms-user');

INSERT INTO user_person_type_limit VALUES ('demos-restricted-cms-user');

INSERT INTO role VALUES ('Restricted CMS User', 'System');

INSERT INTO role_person_type VALUES
    -- system roles
    ('Restricted CMS User', 'demos-restricted-cms-user'),

    -- demonstration role
    ('Project Officer', 'demos-restricted-cms-user'),
    ('DDME Analyst', 'demos-restricted-cms-user'),
    ('Policy Technical Director', 'demos-restricted-cms-user'),
    ('Monitoring & Evaluation Technical Director', 'demos-restricted-cms-user')
;

INSERT INTO role_permission VALUES
	  -- field-based permissions
    ('Restricted CMS User','System','Access CMS Field'),
    ('Restricted CMS User','System','Access CMS Query'),

    -- row-based permissions
    ('Restricted CMS User','System','View All Demonstrations'),
    ('Restricted CMS User','System','View Assigned Demonstrations'),
    ('Restricted CMS User','System','View All Amendments'),
    ('Restricted CMS User','System','View Amendments on Assigned Demonstrations'),
    ('Restricted CMS User','System','View All Extensions'),
    ('Restricted CMS User','System','View Extensions on Assigned Demonstrations'),
    ('Restricted CMS User','System','View All Documents'),
    ('Restricted CMS User','System','View All Deliverables'),
    ('Restricted CMS User','System','View Deliverables on Assigned Demonstrations'),

    ('Restricted CMS User','System','View All DemonstrationRoleAssignments'),
    ('Restricted CMS User','System','View DemonstrationRoleAssignments on Assigned Demonstrations'),
    ('Restricted CMS User','System','View Documents on Assigned Deliverables')
;