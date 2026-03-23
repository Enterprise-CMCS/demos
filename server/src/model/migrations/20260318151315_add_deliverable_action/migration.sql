-- This is an update to make these statuses correct
-- Will fold into collapsed version at the end
UPDATE
    demos_app.deliverable_status
SET
    id = 'Under CMS Review'
WHERE
    id = 'Under Review';

UPDATE
    demos_app.deliverable_status
SET
    id = 'Received and Filed'
WHERE
    id = 'Filed';

-- Add extension reason codes (limited set for now)
INSERT INTO
    demos_app.deliverable_extension_reason_code
VALUES
    ('COVID-19'),
    ('Technical Difficulties'),
    ('Other');

-- Add extension statuses
INSERT INTO
    demos_app.deliverable_extension_status
VALUES
    ('Requested'),
    ('Approved'),
    ('Denied'),
    ('Withdrawn');

-- Add action types
INSERT INTO
    demos_app.deliverable_action_type
VALUES
    ('Created Deliverable Slot', FALSE),
    ('Marked as Past Due', FALSE),
    ('Requested Extension', FALSE),
    ('Approved Extension Request', TRUE),
    ('Denied Extension Request', FALSE),
    ('Withdrew Extension Request', FALSE),
    ('Manually Changed Due Date', TRUE),
    ('Requested Resubmission', TRUE),
    ('Submitted Deliverable', FALSE),
    ('Started Review', FALSE),
    ('Accepted Deliverable', FALSE),
    ('Approved Deliverable', FALSE),
    ('Received and Filed Deliverable', FALSE);

-- Configuring allowed action types
INSERT INTO
    demos_app.deliverable_action_configuration
VALUES
    -- Created Deliverable Slot
    ('Created Deliverable Slot', 'Upcoming', 'Upcoming'),

    -- Marked as Past Due
    ('Marked as Past Due', 'Upcoming', 'Past Due'),

    -- Requested Extension
    ('Requested Extension', 'Upcoming', 'Upcoming'),
    ('Requested Extension', 'Past Due', 'Past Due'),

    -- Approved Extension Request
    ('Approved Extension Request', 'Upcoming', 'Upcoming'),
    ('Approved Extension Request', 'Past Due', 'Upcoming'),
    ('Approved Extension Request', 'Submitted', 'Submitted'),
    ('Approved Extension Request', 'Under CMS Review', 'Under CMS Review'),
    ('Approved Extension Request', 'Accepted', 'Accepted'),
    ('Approved Extension Request', 'Approved', 'Approved'),
    ('Approved Extension Request', 'Received and Filed', 'Received and Filed'),

    -- Denied Extension Request
    ('Denied Extension Request', 'Upcoming', 'Upcoming'),
    ('Denied Extension Request', 'Past Due', 'Past Due'),
    ('Denied Extension Request', 'Submitted', 'Submitted'),
    ('Denied Extension Request', 'Under CMS Review', 'Under CMS Review'),
    ('Denied Extension Request', 'Accepted', 'Accepted'),
    ('Denied Extension Request', 'Approved', 'Approved'),
    ('Denied Extension Request', 'Received and Filed', 'Received and Filed'),

    -- Denied Extension Request
    ('Withdrew Extension Request', 'Upcoming', 'Upcoming'),
    ('Withdrew Extension Request', 'Past Due', 'Past Due'),
    ('Withdrew Extension Request', 'Submitted', 'Submitted'),
    ('Withdrew Extension Request', 'Under CMS Review', 'Under CMS Review'),
    ('Withdrew Extension Request', 'Accepted', 'Accepted'),
    ('Withdrew Extension Request', 'Approved', 'Approved'),
    ('Withdrew Extension Request', 'Received and Filed', 'Received and Filed'),

    -- Manually Changed Due Date
    ('Manually Changed Due Date', 'Upcoming', 'Upcoming'),
    ('Manually Changed Due Date', 'Past Due', 'Upcoming'),
    ('Manually Changed Due Date', 'Submitted', 'Submitted'),
    ('Manually Changed Due Date', 'Under CMS Review', 'Under CMS Review'),
    ('Manually Changed Due Date', 'Accepted', 'Accepted'),
    ('Manually Changed Due Date', 'Approved', 'Approved'),
    ('Manually Changed Due Date', 'Received and Filed', 'Received and Filed'),

    -- Requested Resubmission
    ('Requested Resubmission', 'Submitted', 'Upcoming'),
    ('Requested Resubmission', 'Under CMS Review', 'Upcoming'),

    -- Submitted Deliverable
    ('Submitted Deliverable', 'Upcoming', 'Submitted'),
    ('Submitted Deliverable', 'Past Due', 'Submitted'),
    ('Submitted Deliverable', 'Submitted', 'Submitted'),
    ('Submitted Deliverable', 'Under CMS Review', 'Submitted'),

    -- Started Review
    ('Started Review', 'Submitted', 'Under CMS Review'),

    -- Accepted Deliverable
    ('Accepted Deliverable', 'Under CMS Review', 'Accepted'),

    -- Approved Deliverable
    ('Approved Deliverable', 'Under CMS Review', 'Approved'),

    -- Received and Filed Deliverable
    ('Received and Filed Deliverable', 'Under CMS Review', 'Received and Filed');
