CREATE OR REPLACE FUNCTION log_changes_role_permission()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO role_permission_history (
            revision_type,
            role_id,
            permission_id
        )
        VALUES (
            CASE TG_OP
                WHEN 'INSERT' THEN 'I'::revision_type_enum
                WHEN 'UPDATE' THEN 'U'::revision_type_enum
            END,
            NEW.role_id,
            NEW.permission_id
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO role_permission_history (
            revision_type,
            role_id,
            permission_id
        )
        VALUES (
            'D'::revision_type_enum,
            OLD.role_id,
            OLD.permission_id
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_changes_role_permission_trigger
AFTER INSERT OR UPDATE OR DELETE ON role_permission
FOR EACH ROW EXECUTE FUNCTION log_changes_role_permission();

CREATE OR REPLACE FUNCTION log_changes_user_role()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO user_role_history (
            revision_type,
            user_id,
            role_id
        )
        VALUES (
            CASE TG_OP
                WHEN 'INSERT' THEN 'I'::revision_type_enum
                WHEN 'UPDATE' THEN 'U'::revision_type_enum
            END,
            NEW.user_id,
            NEW.role_id
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO user_role_history (
            revision_type,
            user_id,
            role_id
        )
        VALUES (
            'D'::revision_type_enum,
            OLD.user_id,
            OLD.role_id
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_changes_user_role_trigger
AFTER INSERT OR UPDATE OR DELETE ON user_role
FOR EACH ROW EXECUTE FUNCTION log_changes_user_role();

CREATE OR REPLACE FUNCTION log_changes_user_state()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO user_state_history (
            revision_type,
            user_id,
            state_id
        )
        VALUES (
            CASE TG_OP
                WHEN 'INSERT' THEN 'I'::revision_type_enum
                WHEN 'UPDATE' THEN 'U'::revision_type_enum
            END,
            NEW.user_id,
            NEW.state_id
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO user_state_history (
            revision_type,
            user_id,
            state_id
        )
        VALUES (
            'D'::revision_type_enum,
            OLD.user_id,
            OLD.state_id
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_changes_user_state_trigger
AFTER INSERT OR UPDATE OR DELETE ON user_state
FOR EACH ROW EXECUTE FUNCTION log_changes_user_state();

CREATE OR REPLACE FUNCTION log_changes_user_state_demonstration()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO user_state_demonstration_history (
            revision_type,
            user_id,
            state_id,
            demonstration_id
        )
        VALUES (
            CASE TG_OP
                WHEN 'INSERT' THEN 'I'::revision_type_enum
                WHEN 'UPDATE' THEN 'U'::revision_type_enum
            END,
            NEW.user_id,
            NEW.state_id,
            NEW.demonstration_id
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO user_state_demonstration_history (
            revision_type,
            user_id,
            state_id,
            demonstration_id
        )
        VALUES (
            'D'::revision_type_enum,
            OLD.user_id,
            OLD.state_id,
            OLD.demonstration_id
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_changes_user_state_demonstration_trigger
AFTER INSERT OR UPDATE OR DELETE ON user_state_demonstration
FOR EACH ROW EXECUTE FUNCTION log_changes_user_state_demonstration();

CREATE OR REPLACE FUNCTION log_changes_demonstration()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO demonstration_history (
            revision_type,
            id,
            name,
            description,
            evaluation_period_start_date,
            evaluation_period_end_date,
            created_at,
            updated_at,
            demonstration_status_id,
            state_id
        )
        VALUES (
            CASE TG_OP
                WHEN 'INSERT' THEN 'I'::revision_type_enum
                WHEN 'UPDATE' THEN 'U'::revision_type_enum
            END,
            NEW.id,
            NEW.name,
            NEW.description,
            NEW.evaluation_period_start_date,
            NEW.evaluation_period_end_date,
            NEW.created_at,
            NEW.updated_at,
            NEW.demonstration_status_id,
            NEW.state_id
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO demonstration_history (
            revision_type,
            id,
            name,
            description,
            evaluation_period_start_date,
            evaluation_period_end_date,
            created_at,
            updated_at,
            demonstration_status_id,
            state_id
        )
        VALUES (
            'D'::revision_type_enum,
            OLD.id,
            OLD.name,
            OLD.description,
            OLD.evaluation_period_start_date,
            OLD.evaluation_period_end_date,
            OLD.created_at,
            OLD.updated_at,
            OLD.demonstration_status_id,
            OLD.state_id
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_changes_demonstration_trigger
AFTER INSERT OR UPDATE OR DELETE ON demonstration
FOR EACH ROW EXECUTE FUNCTION log_changes_demonstration();

CREATE OR REPLACE FUNCTION log_changes_demonstration_status()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO demonstration_status_history (
            revision_type,
            id,
            name,
            description,
            created_at,
            updated_at
        )
        VALUES (
            CASE TG_OP
                WHEN 'INSERT' THEN 'I'::revision_type_enum
                WHEN 'UPDATE' THEN 'U'::revision_type_enum
            END,
            NEW.id,
            NEW.name,
            NEW.description,
            NEW.created_at,
            NEW.updated_at
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO demonstration_status_history (
            revision_type,
            id,
            name,
            description,
            created_at,
            updated_at
        )
        VALUES (
            'D'::revision_type_enum,
            OLD.id,
            OLD.name,
            OLD.description,
            OLD.created_at,
            OLD.updated_at
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_changes_demonstration_status_trigger
AFTER INSERT OR UPDATE OR DELETE ON demonstration_status
FOR EACH ROW EXECUTE FUNCTION log_changes_demonstration_status();

CREATE OR REPLACE FUNCTION log_changes_permission()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO permission_history (
            revision_type,
            id,
            name,
            description,
            created_at,
            updated_at
        )
        VALUES (
            CASE TG_OP
                WHEN 'INSERT' THEN 'I'::revision_type_enum
                WHEN 'UPDATE' THEN 'U'::revision_type_enum
            END,
            NEW.id,
            NEW.name,
            NEW.description,
            NEW.created_at,
            NEW.updated_at
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO permission_history (
            revision_type,
            id,
            name,
            description,
            created_at,
            updated_at
        )
        VALUES (
            'D'::revision_type_enum,
            OLD.id,
            OLD.name,
            OLD.description,
            OLD.created_at,
            OLD.updated_at
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_changes_permission_trigger
AFTER INSERT OR UPDATE OR DELETE ON permission
FOR EACH ROW EXECUTE FUNCTION log_changes_permission();

CREATE OR REPLACE FUNCTION log_changes_role()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO role_history (
            revision_type,
            id,
            name,
            description,
            created_at,
            updated_at
        )
        VALUES (
            CASE TG_OP
                WHEN 'INSERT' THEN 'I'::revision_type_enum
                WHEN 'UPDATE' THEN 'U'::revision_type_enum
            END,
            NEW.id,
            NEW.name,
            NEW.description,
            NEW.created_at,
            NEW.updated_at
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO role_history (
            revision_type,
            id,
            name,
            description,
            created_at,
            updated_at
        )
        VALUES (
            'D'::revision_type_enum,
            OLD.id,
            OLD.name,
            OLD.description,
            OLD.created_at,
            OLD.updated_at
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_changes_role_trigger
AFTER INSERT OR UPDATE OR DELETE ON role
FOR EACH ROW EXECUTE FUNCTION log_changes_role();

CREATE OR REPLACE FUNCTION log_changes_state()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO state_history (
            revision_type,
            id,
            state_code,
            state_name
        )
        VALUES (
            CASE TG_OP
                WHEN 'INSERT' THEN 'I'::revision_type_enum
                WHEN 'UPDATE' THEN 'U'::revision_type_enum
            END,
            NEW.id,
            NEW.state_code,
            NEW.state_name
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO state_history (
            revision_type,
            id,
            state_code,
            state_name
        )
        VALUES (
            'D'::revision_type_enum,
            OLD.id,
            OLD.state_code,
            OLD.state_name
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_changes_state_trigger
AFTER INSERT OR UPDATE OR DELETE ON state
FOR EACH ROW EXECUTE FUNCTION log_changes_state();

CREATE OR REPLACE FUNCTION log_changes_users()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        INSERT INTO users_history (
            revision_type,
            id,
            cognito_subject,
            username,
            email,
            full_name,
            display_name,
            created_at,
            updated_at
        )
        VALUES (
            CASE TG_OP
                WHEN 'INSERT' THEN 'I'::revision_type_enum
                WHEN 'UPDATE' THEN 'U'::revision_type_enum
            END,
            NEW.id,
            NEW.cognito_subject,
            NEW.username,
            NEW.email,
            NEW.full_name,
            NEW.display_name,
            NEW.created_at,
            NEW.updated_at
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO users_history (
            revision_type,
            id,
            cognito_subject,
            username,
            email,
            full_name,
            display_name,
            created_at,
            updated_at
        )
        VALUES (
            'D'::revision_type_enum,
            OLD.id,
            OLD.cognito_subject,
            OLD.username,
            OLD.email,
            OLD.full_name,
            OLD.display_name,
            OLD.created_at,
            OLD.updated_at
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_changes_users_trigger
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION log_changes_users();

