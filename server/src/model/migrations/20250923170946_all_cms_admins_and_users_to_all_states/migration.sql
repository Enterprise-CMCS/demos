-- Create the trigger function
CREATE OR REPLACE FUNCTION assign_cms_user_to_all_states()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the inserted person is a demos-cms-user or a demos-admin
    IF NEW.person_type_id IN ('demos-admin', 'demos-cms-user') THEN
        -- Insert a record into person_state for each state
        INSERT INTO person_state (person_id, state_id)
        SELECT 
            NEW.id,
            s.id
        FROM state s;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE OR REPLACE TRIGGER trigger_assign_cms_user_to_states
AFTER INSERT ON person
FOR EACH ROW
EXECUTE FUNCTION assign_cms_user_to_all_states();
