DELETE FROM demonstration_bundle_type_limit;
DELETE FROM modification_bundle_type_limit;
DELETE FROM bundle_type;
INSERT INTO bundle_type (id)
VALUES
    ('Demonstration'),
    ('Amendment'),
    ('Extension');
INSERT INTO demonstration_bundle_type_limit (id)
VALUES
    ('Demonstration');
INSERT INTO modification_bundle_type_limit (id)
VALUES
    ('Amendment'),
    ('Extension');


