CREATE OR REPLACE FUNCTION demos_app.validate_deliverable_demo_type_invariant(deliverable_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    deliverable_type_id TEXT;
    remaining_count INT;
BEGIN
    SELECT deliverable_type_id
    INTO deliverable_type_id
    FROM demos_app.deliverable
    WHERE id = deliverable_id;
    IF deliverable_type_id IN ('Implementation Plan', 'Monitoring Protocol') THEN
        SELECT COUNT(*)
        INTO remaining_count
        FROM demos_app.deliverable_demonstration_type
        WHERE deliverable_id = deliverable_id;
        IF remaining_count = 0 THEN
            RAISE EXCEPTION
                'Deliverable type % requires at least one demonstration type',
                deliverable_type_id;
        END IF;
    END IF;
END;
$$;

CREATE CONSTRAINT TRIGGER validate_ddt_delete
AFTER DELETE ON demos_app.deliverable_demonstration_type
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION demos_app.validate_deliverable_demo_type_invariant(OLD.deliverable_id);

CREATE CONSTRAINT TRIGGER validate_deliverable_type_change
AFTER INSERT OR UPDATE OF deliverable_type_id
ON demos_app.deliverable
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION demos_app.validate_deliverable_demo_type_invariant(NEW.id);
