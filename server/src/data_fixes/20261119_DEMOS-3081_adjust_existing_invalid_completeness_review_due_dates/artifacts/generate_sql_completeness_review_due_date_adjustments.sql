WITH holidays AS (
    SELECT
        holiday_string,
        holiday_date
    FROM (
        VALUES
        -- 2026
        ('Thursday, January 01 	New Year''s Day', '2026-01-01'::DATE),
        ('Monday, January 19 	Birthday of Martin Luther King, Jr.', '2026-01-19'::DATE),
        ('Monday, February 16 	Washington''s Birthday', '2026-02-16'::DATE),
        ('Monday, May 25 	Memorial Day', '2026-05-25'::DATE),
        ('Friday, June 19 	Juneteenth National Independence Day', '2026-06-19'::DATE),
        ('Friday, July 03 	Independence Day', '2026-07-03'::DATE),
        ('Monday, September 07 	Labor Day', '2026-09-07'::DATE),
        ('Monday, October 12 	Columbus Day', '2026-10-12'::DATE),
        ('Wednesday, November 11 	Veterans Day', '2026-11-11'::DATE),
        ('Thursday, November 26 	Thanksgiving Day', '2026-11-26'::DATE),
        ('Friday, December 25 	Christmas Day', '2026-12-25'::DATE),

        -- 2025
        ('Wednesday, January 01 	New Year''s Day', '2025-01-01'::DATE),
        ('Monday, January 20 	Birthday of Martin Luther King, Jr.', '2025-01-20'::DATE),
        ('Monday, January 20 * 	Inauguration Day', '2025-01-20'::DATE),
        ('Monday, February 17 ** 	Washington''s Birthday', '2025-02-17'::DATE),
        ('Monday, May 26 	Memorial Day', '2025-05-26'::DATE),
        ('Thursday, June 19 	Juneteenth National Independence Day', '2025-06-19'::DATE),
        ('Friday, July 04 	Independence Day', '2025-07-04'::DATE),
        ('Monday, September 01 	Labor Day', '2025-09-01'::DATE),
        ('Monday, October 13 	Columbus Day', '2025-10-13'::DATE),
        ('Tuesday, November 11 	Veterans Day', '2025-11-11'::DATE),
        ('Thursday, November 27 	Thanksgiving Day', '2025-11-27'::DATE),
        ('Thursday, December 25 	Christmas day', '2025-12-25'::DATE),

        -- 2024
        ('Monday, January 01 	New Year''s Day', '2024-01-01'::DATE),
        ('Monday, January 15 	Birthday of Martin Luther King, Jr.', '2024-01-15'::DATE),
        ('Monday, February 19 * 	Washington''s Birthday', '2024-02-19'::DATE),
        ('Monday, May 27 	Memorial Day', '2024-05-27'::DATE),
        ('Wednesday, June 19 	Juneteenth National Independence Day', '2024-06-19'::DATE),
        ('Thursday, July 04 	Independence Day', '2024-07-04'::DATE),
        ('Monday, September 02 	Labor Day', '2024-09-02'::DATE),
        ('Monday, October 14 	Columbus Day', '2024-10-14'::DATE),
        ('Monday, November 11 	Veterans Day', '2024-11-11'::DATE),
        ('Thursday, November 28 	Thanksgiving Day', '2024-11-28'::DATE),
        ('Wednesday, December 25 	Christmas day', '2024-12-25'::DATE),

        -- 2023
        ('Monday, January 02 * 	New Year''s Day', '2023-01-02'::DATE),
        ('Monday, January 16 	Birthday of Martin Luther King, Jr.', '2023-01-16'::DATE),
        ('Monday, February 20 ** 	Washington''s Birthday', '2023-02-20'::DATE),
        ('Monday, May 29 	Memorial Day', '2023-05-29'::DATE),
        ('Monday, June 19 	Juneteenth National Independence Day', '2023-06-19'::DATE),
        ('Tuesday, July 04 	Independence Day', '2023-07-04'::DATE),
        ('Monday, September 04 	Labor Day', '2023-09-04'::DATE),
        ('Monday, October 09 	Columbus Day', '2023-10-09'::DATE),
        ('Friday, November 10 * 	Veterans Day', '2023-11-10'::DATE),
        ('Thursday, November 23 	Thanksgiving Day', '2023-11-23'::DATE),
        ('Monday, December 25 	Christmas day', '2023-12-25'::DATE),

        -- 2022
        ('Friday, December 31 * 	New Year''s Day', '2021-12-31'::DATE),
        ('Monday, January 17 	Birthday of Martin Luther King, Jr.', '2022-01-17'::DATE),
        ('Monday, February 21 ** 	Washington''s Birthday', '2022-02-21'::DATE),
        ('Monday, May 30 	Memorial Day', '2022-05-30'::DATE),
        ('Monday, June 20 * 	Juneteenth National Independence Day', '2022-06-20'::DATE),
        ('Monday, July 04 	Independence Day', '2022-07-04'::DATE),
        ('Monday, September 05 	Labor Day', '2022-09-05'::DATE),
        ('Monday, October 10 	Columbus Day', '2022-10-10'::DATE),
        ('Friday, November 11 	Veterans Day', '2022-11-11'::DATE),
        ('Thursday, November 24 	Thanksgiving Day', '2022-11-24'::DATE),
        ('Monday, December 26 * 	Christmas Day', '2022-12-26'::DATE),

        -- 2021
        ('Friday, January 01 	New Year''s Day', '2021-01-01'::DATE),
        ('Monday, January 18 	Birthday of Martin Luther King, Jr.', '2021-01-18'::DATE),
        ('Wednesday, January 20 * 	Inauguration Day', '2021-01-20'::DATE),
        ('Monday, February 15 ** 	Washington''s Birthday', '2021-02-15'::DATE),
        ('Monday, May 31 	Memorial Day', '2021-05-31'::DATE),
        ('Friday, June 18 *** 	Juneteenth National Independence Day', '2021-06-18'::DATE),
        ('Monday, July 05 *** 	Independence Day', '2021-07-05'::DATE),
        ('Monday, September 06 	Labor Day', '2021-09-06'::DATE),
        ('Monday, October 11 	Columbus Day', '2021-10-11'::DATE),
        ('Thursday, November 11 	Veterans Day', '2021-11-11'::DATE),
        ('Thursday, November 25 	Thanksgiving Day', '2021-11-25'::DATE),
        ('Friday, December 24 *** 	Christmas day', '2021-12-24'::DATE),

        -- 2020
        ('Wednesday, January 1 	New Year''s Day', '2020-01-01'::DATE),
        ('Monday, January 20 	Birthday of Martin Luther King, Jr.', '2020-01-20'::DATE),
        ('Monday, February 17* 	Washington''s Birthday', '2020-02-17'::DATE),
        ('Monday, May 25 	Memorial Day', '2020-05-25'::DATE),
        ('Friday, July 3** 	Independence Day', '2020-07-03'::DATE),
        ('Monday, September 7 	Labor Day', '2020-09-07'::DATE),
        ('Monday, October 12 	Columbus Day', '2020-10-12'::DATE),
        ('Wednesday, November 11 	Veterans Day', '2020-11-11'::DATE),
        ('Thursday, November 26 	Thanksgiving Day', '2020-11-26'::DATE),
        ('Friday, December 25 	Christmas day', '2020-12-25'::DATE),

        -- 2019
        ('Tuesday, January 1 	New Year''s Day', '2019-01-01'::DATE),
        ('Monday, January 21 	Birthday of Martin Luther King, Jr.', '2019-01-21'::DATE),
        ('Monday, February 18* 	Washington''s Birthday', '2019-02-18'::DATE),
        ('Monday, May 27 	Memorial Day', '2019-05-27'::DATE),
        ('Thursday, July 4 	Independence Day', '2019-07-04'::DATE),
        ('Monday, September 2 	Labor Day', '2019-09-02'::DATE),
        ('Monday, October 14 	Columbus Day', '2019-10-14'::DATE),
        ('Monday, November 11 	Veterans Day', '2019-11-11'::DATE),
        ('Thursday, November 28 	Thanksgiving Day', '2019-11-28'::DATE),
        ('Wednesday, December 25 	Christmas day', '2019-12-25'::DATE),

        -- 2018
        ('Monday, January 1 	New Year''s Day', '2018-01-01'::DATE),
        ('Monday, January 15 	Birthday of Martin Luther King, Jr.', '2018-01-15'::DATE),
        ('Monday, February 19* 	Washington''s Birthday', '2018-02-19'::DATE),
        ('Monday, May 28 	Memorial Day', '2018-05-28'::DATE),
        ('Wednesday, July 4 	Independence Day', '2018-07-04'::DATE),
        ('Monday, September 3 	Labor Day', '2018-09-03'::DATE),
        ('Monday, October 8 	Columbus Day', '2018-10-08'::DATE),
        ('Monday, November 12** 	Veterans Day', '2018-11-12'::DATE),
        ('Thursday, November 22 	Thanksgiving Day', '2018-11-22'::DATE),
        ('Tuesday, December 25 	Christmas day', '2018-12-25'::DATE),

        -- 2017
        ('Monday, January 2* 	New Year''s Day', '2017-01-02'::DATE),
        ('Monday, January 16 	Birthday of Martin Luther King, Jr.', '2017-01-16'::DATE),
        ('Monday, February 20** 	Washington''s Birthday', '2017-02-20'::DATE),
        ('Monday, May 29 	Memorial Day', '2017-05-29'::DATE),
        ('Tuesday, July 4 	Independence Day', '2017-07-04'::DATE),
        ('Monday, September 4 	Labor Day', '2017-09-04'::DATE),
        ('Monday, October 9 	Columbus Day', '2017-10-09'::DATE),
        ('Friday, November 10*** 	Veterans Day', '2017-11-10'::DATE),
        ('Thursday, November 23 	Thanksgiving Day', '2017-11-23'::DATE),
        ('Monday, December 25 	Christmas day', '2017-12-25'::DATE)
    ) AS t (holiday_string, holiday_date)
),

completeness_review_due_date AS (
    SELECT
        application_date.application_id,
        application_date.date_type_id,
        application_date.date_value AS original_date_value,
        application_date.date_value - INTERVAL '1 day' AS adjustment_1_date_value,
        application_date.date_value - INTERVAL '2 day' AS adjustment_2_date_value,
        application_date.date_value - INTERVAL '3 day' AS adjustment_3_date_value
    FROM demos_app.application_date
    WHERE application_date.date_type_id = 'Completeness Review Due Date'
),

date_properties AS (
    SELECT
        completeness_review_due_date.*,
        to_char(completeness_review_due_date.original_date_value AT TIME ZONE 'America/New_York', 'Day')
            AS original_day_of_week,
        to_char(completeness_review_due_date.adjustment_1_date_value AT TIME ZONE 'America/New_York', 'Day')
            AS adjustment_1_day_of_week,
        to_char(completeness_review_due_date.adjustment_2_date_value AT TIME ZONE 'America/New_York', 'Day')
            AS adjustment_2_day_of_week,
        to_char(completeness_review_due_date.adjustment_3_date_value AT TIME ZONE 'America/New_York', 'Day')
            AS adjustment_3_day_of_week,
        holidays_original.holiday_string AS original_holiday,
        holidays_1.holiday_string AS adjustment_1_holiday,
        holidays_2.holiday_string AS adjustment_2_holiday,
        holidays_3.holiday_string AS adjustment_3_holiday
    FROM completeness_review_due_date
    LEFT JOIN holidays AS holidays_original
        ON
            (completeness_review_due_date.original_date_value AT TIME ZONE 'America/New_York')::DATE
            = holidays_original.holiday_date
    LEFT JOIN holidays AS holidays_1
        ON
            (completeness_review_due_date.adjustment_1_date_value AT TIME ZONE 'America/New_York')::DATE
            = holidays_1.holiday_date
    LEFT JOIN holidays AS holidays_2
        ON
            (completeness_review_due_date.adjustment_2_date_value AT TIME ZONE 'America/New_York')::DATE
            = holidays_2.holiday_date
    LEFT JOIN holidays AS holidays_3
        ON
            (completeness_review_due_date.adjustment_3_date_value AT TIME ZONE 'America/New_York')::DATE
            = holidays_3.holiday_date
),

adjustment_summary AS (
    SELECT
        date_properties.application_id,
        date_properties.date_type_id,
        date_properties.original_date_value,
        CASE
            WHEN
                trim(date_properties.adjustment_1_day_of_week) NOT IN ('Saturday', 'Sunday')
                AND date_properties.adjustment_1_holiday IS NULL
                THEN date_properties.adjustment_1_date_value
            WHEN
                trim(date_properties.adjustment_2_day_of_week) NOT IN ('Saturday', 'Sunday')
                AND date_properties.adjustment_2_holiday IS NULL
                THEN date_properties.adjustment_2_date_value
            WHEN
                trim(date_properties.adjustment_3_day_of_week) NOT IN ('Saturday', 'Sunday')
                AND date_properties.adjustment_3_holiday IS NULL
                THEN date_properties.adjustment_3_date_value
        END AS adjusted_date_value,
        CASE
            WHEN
                (
                    trim(date_properties.adjustment_1_day_of_week) NOT IN ('Saturday', 'Sunday')
                    AND date_properties.adjustment_1_holiday IS NULL
                )
                THEN
                    'Original date was ' || trim(date_properties.original_day_of_week)
                    || CASE
                        WHEN
                            date_properties.original_holiday IS NOT NULL
                            THEN ' (' || trim(date_properties.original_holiday) || ')'
                        ELSE ''
                    END
                    || '; adjusted back 1 day'
            WHEN
                (
                    trim(date_properties.adjustment_2_day_of_week) NOT IN ('Saturday', 'Sunday')
                    AND date_properties.adjustment_2_holiday IS NULL
                )
                THEN
                    'Original date was ' || trim(date_properties.original_day_of_week)
                    || CASE
                        WHEN
                            date_properties.original_holiday IS NOT NULL
                            THEN ' (' || trim(date_properties.original_holiday) || ')'
                        ELSE ''
                    END
                    || '; adjusted back 2 days'
            WHEN
                (
                    trim(date_properties.adjustment_3_day_of_week) NOT IN ('Saturday', 'Sunday')
                    AND date_properties.adjustment_3_holiday IS NULL
                )
                THEN
                    'Original date was ' || trim(date_properties.original_day_of_week)
                    || CASE
                        WHEN
                            date_properties.original_holiday IS NOT NULL
                            THEN ' (' || trim(date_properties.original_holiday) || ')'
                        ELSE ''
                    END
                    || '; adjusted back 3 days'
        END AS adjustment_reason
    FROM date_properties
    WHERE
        trim(date_properties.original_day_of_week) IN ('Saturday', 'Sunday')
        OR date_properties.original_holiday IS NOT NULL
)

SELECT
    adjustment_summary.*,
    'UPDATE demos_app.application_date SET date_value = '''
    || adjustment_summary.adjusted_date_value::TEXT
    || ''' WHERE application_id = '''
    || adjustment_summary.application_id::TEXT
    || ''' AND date_type_id = '''
    || adjustment_summary.date_type_id
    || ''';' AS update_statement,
    'UPDATE demos_app.application_date SET date_value = '''
    || adjustment_summary.original_date_value::TEXT
    || ''' WHERE application_id = '''
    || adjustment_summary.application_id::TEXT
    || ''' AND date_type_id = '''
    || adjustment_summary.date_type_id
    || ''';' AS rollback_statement,
    '(application_date.application_id = '''
    || adjustment_summary.application_id::TEXT
    || ''' AND application_date.date_type_id = '''
    || adjustment_summary.date_type_id
    || ''' AND application_date.date_value = '''
    || adjustment_summary.adjusted_date_value::TEXT
    || ''')' AS validation_where_clause,
    '(application_date.application_id = '''
    || adjustment_summary.application_id::TEXT
    || ''' AND application_date.date_type_id = '''
    || adjustment_summary.date_type_id
    || ''' AND application_date.date_value = '''
    || adjustment_summary.original_date_value::TEXT
    || ''')' AS revert_validation_where_clause
FROM adjustment_summary;
