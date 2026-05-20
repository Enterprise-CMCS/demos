SET search_path TO demos_app;

-- Prisma Generated
-- AlterTable
ALTER TABLE "state" ADD COLUMN     "region" INTEGER NOT NULL DEFAULT 0;

-- Manually Updated
-- Fix existing regions to be correct
WITH state_region_map AS (
    SELECT 'AK' AS id, 10 AS region UNION ALL
    SELECT 'AL' AS id, 4 AS region UNION ALL
    SELECT 'AR' AS id, 6 AS region UNION ALL
    SELECT 'AS' AS id, 9 AS region UNION ALL
    SELECT 'AZ' AS id, 9 AS region UNION ALL
    SELECT 'CA' AS id, 9 AS region UNION ALL
    SELECT 'CO' AS id, 8 AS region UNION ALL
    SELECT 'CT' AS id, 1 AS region UNION ALL
    SELECT 'DC' AS id, 3 AS region UNION ALL
    SELECT 'DE' AS id, 3 AS region UNION ALL
    SELECT 'FL' AS id, 4 AS region UNION ALL
    SELECT 'GA' AS id, 4 AS region UNION ALL
    SELECT 'GU' AS id, 9 AS region UNION ALL
    SELECT 'HI' AS id, 9 AS region UNION ALL
    SELECT 'IA' AS id, 7 AS region UNION ALL
    SELECT 'ID' AS id, 10 AS region UNION ALL
    SELECT 'IL' AS id, 5 AS region UNION ALL
    SELECT 'IN' AS id, 5 AS region UNION ALL
    SELECT 'KS' AS id, 7 AS region UNION ALL
    SELECT 'KY' AS id, 4 AS region UNION ALL
    SELECT 'LA' AS id, 6 AS region UNION ALL
    SELECT 'MA' AS id, 1 AS region UNION ALL
    SELECT 'MD' AS id, 3 AS region UNION ALL
    SELECT 'ME' AS id, 1 AS region UNION ALL
    SELECT 'MI' AS id, 5 AS region UNION ALL
    SELECT 'MN' AS id, 5 AS region UNION ALL
    SELECT 'MO' AS id, 7 AS region UNION ALL
    SELECT 'MP' AS id, 9 AS region UNION ALL
    SELECT 'MS' AS id, 4 AS region UNION ALL
    SELECT 'MT' AS id, 8 AS region UNION ALL
    SELECT 'NC' AS id, 4 AS region UNION ALL
    SELECT 'ND' AS id, 8 AS region UNION ALL
    SELECT 'NE' AS id, 7 AS region UNION ALL
    SELECT 'NH' AS id, 1 AS region UNION ALL
    SELECT 'NJ' AS id, 2 AS region UNION ALL
    SELECT 'NM' AS id, 6 AS region UNION ALL
    SELECT 'NV' AS id, 9 AS region UNION ALL
    SELECT 'NY' AS id, 2 AS region UNION ALL
    SELECT 'OH' AS id, 5 AS region UNION ALL
    SELECT 'OK' AS id, 6 AS region UNION ALL
    SELECT 'OR' AS id, 10 AS region UNION ALL
    SELECT 'PA' AS id, 3 AS region UNION ALL
    SELECT 'PR' AS id, 2 AS region UNION ALL
    SELECT 'RI' AS id, 1 AS region UNION ALL
    SELECT 'SC' AS id, 4 AS region UNION ALL
    SELECT 'SD' AS id, 8 AS region UNION ALL
    SELECT 'TN' AS id, 4 AS region UNION ALL
    SELECT 'TX' AS id, 6 AS region UNION ALL
    SELECT 'UT' AS id, 8 AS region UNION ALL
    SELECT 'VA' AS id, 3 AS region UNION ALL
    SELECT 'VI' AS id, 2 AS region UNION ALL
    SELECT 'VT' AS id, 1 AS region UNION ALL
    SELECT 'WA' AS id, 10 AS region UNION ALL
    SELECT 'WI' AS id, 5 AS region UNION ALL
    SELECT 'WV' AS id, 3 AS region UNION ALL
    SELECT 'WY' AS id, 8 AS region
)
UPDATE
    demos_app.state AS s
SET
    region = srm.region
FROM
    state_region_map AS srm
WHERE
    s.id = srm.id;

-- Drop the default
ALTER TABLE demos_app.state ALTER COLUMN region DROP DEFAULT;

-- Add check constraint for region, which checks if I missed any as well
ALTER TABLE
    demos_app.state
ADD CONSTRAINT
    check_region_is_valid
CHECK (
    region BETWEEN 1 AND 10
);

-- Insert new territories
INSERT INTO
    demos_app.state (
        id,
        "name",
        region
    )
VALUES
    ('FM', 'Federated States of Micronesia', 9),
    ('PW', 'Republic of Palau', 9),
    ('MH', 'Republic of the Marshall Islands', 9);

-- Assign CMS users and admins to these new territories
INSERT INTO
    demos_app.person_state (
        person_id,
        state_id
    )
SELECT
    p.id,
    s.id
FROM
    demos_app.person AS p
INNER JOIN
    demos_app.state AS s ON
        p.person_type_id IN ('demos-admin', 'demos-cms-user')
        AND s.id IN ('FM', 'PW', 'MH');
