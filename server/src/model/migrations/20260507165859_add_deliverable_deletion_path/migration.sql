SET search_path TO demos_app;

INSERT INTO
    demos_app.deliverable_status
VALUES
    ('Deleted');

INSERT INTO
    demos_app.deliverable_action_type
VALUES
    ('Deleted Deliverable', false, false, true, true);

INSERT INTO
    demos_app.deliverable_action_configuration
VALUES
    ('Deleted Deliverable', 'Upcoming', 'Deleted'),
    ('Deleted Deliverable', 'Past Due', 'Deleted');
