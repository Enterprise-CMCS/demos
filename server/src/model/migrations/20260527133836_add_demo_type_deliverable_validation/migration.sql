CREATE OR REPLACE FUNCTION demos_app.validate_required_deliverable_demo_types()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    target_deliverable_id UUID;
    deliverable_type_id TEXT;
    remaining_count INTEGER;
BEGIN
    target_deliverable_id :=
        COALESCE(NEW.deliverable_id, OLD.deliverable_id);
    SELECT deliverable_type_id
    INTO deliverable_type_id
    FROM demos_app.deliverable
    WHERE id = target_deliverable_id;
    IF deliverable_type_id IN (
        'Implementation Plan',
        'Monitoring Protocol'
    ) THEN
        SELECT COUNT(*)
        INTO remaining_count
        FROM demos_app.deliverable_demonstration_type
        WHERE deliverable_id = target_deliverable_id;
        IF remaining_count = 0 THEN
            RAISE EXCEPTION
                'Deliverable type % requires at least one demonstration type',
                deliverable_type_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS validate_required_demo_types_on_ddt
ON demos_app.deliverable_demonstration_type;

CREATE CONSTRAINT TRIGGER validate_required_demo_types_on_ddt
AFTER INSERT OR UPDATE OR DELETE
ON demos_app.deliverable_demonstration_type
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION demos_app.validate_required_deliverable_demo_types();

DROP TRIGGER IF EXISTS validate_required_demo_types_on_deliverable
ON demos_app.deliverable;

CREATE CONSTRAINT TRIGGER validate_required_demo_types_on_deliverable
AFTER INSERT OR UPDATE OF deliverable_type_id OR DELETE
ON demos_app.deliverable
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION demos_app.validate_required_deliverable_demo_types();
