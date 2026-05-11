SET search_path TO demos_app;

ALTER TABLE
    demos_app.public_comment
ADD CONSTRAINT
    check_non_empty_content
CHECK (
    trim(content) != ''
);

ALTER TABLE
    demos_app.private_comment
ADD CONSTRAINT
    check_non_empty_content
CHECK (
    trim(content) != ''
);
