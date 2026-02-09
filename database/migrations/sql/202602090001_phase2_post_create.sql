CREATE UNIQUE INDEX uq_plan_assignments_user_active
ON plan_assignments (user_id)
WHERE status = 'active'::plan_assignment_status;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_workouts_set_updated_at
BEFORE UPDATE ON workouts
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_workout_plans_set_updated_at
BEFORE UPDATE ON workout_plans
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_workout_sessions_set_updated_at
BEFORE UPDATE ON workout_sessions
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_exercise_logs_set_updated_at
BEFORE UPDATE ON exercise_logs
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.enforce_coach_assignment_rules()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    coach_role user_role;
    user_role_value user_role;
    assigned_by_role user_role;
    assignment_count integer;
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.coach_id = NEW.coach_id THEN
        assignment_count := (
            SELECT COUNT(*)
            FROM coach_user_assignments
            WHERE coach_id = NEW.coach_id
              AND id <> NEW.id
        );
    ELSE
        assignment_count := (
            SELECT COUNT(*)
            FROM coach_user_assignments
            WHERE coach_id = NEW.coach_id
        );
    END IF;

    IF assignment_count >= 50 THEN
        RAISE EXCEPTION 'Coach % cannot exceed 50 assigned users', NEW.coach_id;
    END IF;

    SELECT role INTO coach_role FROM users WHERE id = NEW.coach_id;
    IF coach_role IS DISTINCT FROM 'coach'::user_role THEN
        RAISE EXCEPTION 'coach_id % must reference a user with coach role', NEW.coach_id;
    END IF;

    SELECT role INTO user_role_value FROM users WHERE id = NEW.user_id;
    IF user_role_value IS DISTINCT FROM 'user'::user_role THEN
        RAISE EXCEPTION 'user_id % must reference a user with user role', NEW.user_id;
    END IF;

    SELECT role INTO assigned_by_role FROM users WHERE id = NEW.assigned_by;
    IF assigned_by_role IS DISTINCT FROM 'admin'::user_role THEN
        RAISE EXCEPTION 'assigned_by % must reference a user with admin role', NEW.assigned_by;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_coach_assignment_rules
BEFORE INSERT OR UPDATE ON coach_user_assignments
FOR EACH ROW
EXECUTE FUNCTION public.enforce_coach_assignment_rules();
