CREATE OR REPLACE FUNCTION demos_app.validate_deliverable_demo_type_invariant()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    target_deliverable_id UUID;
    deliverable_type_id TEXT;
    remaining_count INT;
BEGIN
    IF TG_TABLE_NAME = 'deliverable_demonstration_type' THEN
        IF TG_OP = 'DELETE' THEN
            target_deliverable_id := OLD.deliverable_id;
        ELSIF TG_OP IN ('INSERT', 'UPDATE') THEN
            target_deliverable_id := NEW.deliverable_id;
        ELSE
            RAISE EXCEPTION 'Unsupported operation on deliverable_demonstration_type';
        END IF;
    ELSIF TG_TABLE_NAME = 'deliverable' THEN
        target_deliverable_id := NEW.id;
        IF TG_OP = 'DELETE' THEN
            target_deliverable_id := OLD.id;
        END IF;
    ELSE
        RAISE EXCEPTION 'Invalid trigger table: %', TG_TABLE_NAME;
    END IF;
    SELECT deliverable_type_id
    INTO deliverable_type_id
    FROM demos_app.deliverable
    WHERE id = target_deliverable_id;
    IF deliverable_type_id IN ('Implementation Plan', 'Monitoring Protocol') THEN
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
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

DROP TRIGGER IF EXISTS validate_required_demo_types_on_ddt
ON demos_app.deliverable_demonstration_type;

CREATE CONSTRAINT TRIGGER validate_required_demo_types_on_ddt
AFTER INSERT OR UPDATE OR DELETE
ON demos_app.deliverable_demonstration_type
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION demos_app.validate_deliverable_demo_type_invariant();

DROP TRIGGER IF EXISTS validate_required_demo_types_on_deliverable
ON demos_app.deliverable;

CREATE CONSTRAINT TRIGGER validate_required_demo_types_on_deliverable
AFTER INSERT OR UPDATE OF deliverable_type_id
ON demos_app.deliverable
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION demos_app.validate_deliverable_demo_type_invariant();
