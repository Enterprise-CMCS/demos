-- Migration to empty the event_type table
-- Allows the changes in the next migration to succeed
TRUNCATE TABLE "event_type" CASCADE;
