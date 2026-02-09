DO $block$
BEGIN
    IF to_regprocedure('auth.uid()') IS NULL THEN
        CREATE SCHEMA IF NOT EXISTS auth;
        EXECUTE '
            CREATE OR REPLACE FUNCTION auth.uid()
            RETURNS uuid
            LANGUAGE sql
            STABLE
            AS $fn$ SELECT NULL::uuid $fn$;
        ';
    END IF;
END
$block$;

CREATE OR REPLACE FUNCTION public.current_user_role(request_user uuid DEFAULT auth.uid())
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role
    FROM public.users
    WHERE id = request_user
    LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_admin(request_user uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(public.current_user_role(request_user) = 'admin'::user_role, false)
$$;

CREATE OR REPLACE FUNCTION public.is_coach_of(coach_user uuid, target_user uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.coach_user_assignments cua
        WHERE cua.coach_id = coach_user
          AND cua.user_id = target_user
    )
$$;

CREATE OR REPLACE FUNCTION public.can_access_user(request_user uuid, target_user uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(
        request_user = target_user
        OR public.is_admin(request_user)
        OR public.is_coach_of(request_user, target_user),
        false
    )
$$;

GRANT EXECUTE ON FUNCTION public.current_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_coach_of(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_user(uuid, uuid) TO authenticated;

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_user_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE muscle_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE cardio_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_muscle_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_day_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select_access ON users
FOR SELECT
USING (public.can_access_user(auth.uid(), id));

CREATE POLICY users_insert_self_or_admin ON users
FOR INSERT
WITH CHECK (auth.uid() = id OR public.is_admin(auth.uid()));

CREATE POLICY users_update_self_or_admin ON users
FOR UPDATE
USING (auth.uid() = id OR public.is_admin(auth.uid()))
WITH CHECK (auth.uid() = id OR public.is_admin(auth.uid()));

CREATE POLICY users_delete_admin_only ON users
FOR DELETE
USING (public.is_admin(auth.uid()));

CREATE POLICY cua_select_visibility ON coach_user_assignments
FOR SELECT
USING (
    public.is_admin(auth.uid())
    OR coach_id = auth.uid()
    OR user_id = auth.uid()
);

CREATE POLICY cua_insert_admin_only ON coach_user_assignments
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY cua_update_admin_only ON coach_user_assignments
FOR UPDATE
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY cua_delete_admin_only ON coach_user_assignments
FOR DELETE
USING (public.is_admin(auth.uid()));

CREATE POLICY muscle_groups_select_authenticated ON muscle_groups
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY muscle_groups_admin_write ON muscle_groups
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY cardio_types_select_authenticated ON cardio_types
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY cardio_types_admin_write ON cardio_types
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY workouts_select_authenticated ON workouts
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY workouts_admin_write ON workouts
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY workout_muscle_groups_select_authenticated ON workout_muscle_groups
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY workout_muscle_groups_admin_write ON workout_muscle_groups
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY workout_plans_select_scope ON workout_plans
FOR SELECT
USING (
    public.is_admin(auth.uid())
    OR coach_id = auth.uid()
    OR EXISTS (
        SELECT 1
        FROM plan_assignments pa
        WHERE pa.plan_id = workout_plans.id
          AND pa.user_id = auth.uid()
    )
);

CREATE POLICY workout_plans_insert_scope ON workout_plans
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()) OR coach_id = auth.uid());

CREATE POLICY workout_plans_update_scope ON workout_plans
FOR UPDATE
USING (public.is_admin(auth.uid()) OR coach_id = auth.uid())
WITH CHECK (public.is_admin(auth.uid()) OR coach_id = auth.uid());

CREATE POLICY workout_plans_delete_scope ON workout_plans
FOR DELETE
USING (public.is_admin(auth.uid()) OR coach_id = auth.uid());

CREATE POLICY plan_days_select_scope ON plan_days
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM workout_plans wp
        WHERE wp.id = plan_days.plan_id
          AND (
              public.is_admin(auth.uid())
              OR wp.coach_id = auth.uid()
              OR EXISTS (
                  SELECT 1
                  FROM plan_assignments pa
                  WHERE pa.plan_id = wp.id
                    AND pa.user_id = auth.uid()
              )
          )
    )
);

CREATE POLICY plan_days_write_scope ON plan_days
FOR ALL
USING (
    EXISTS (
        SELECT 1
        FROM workout_plans wp
        WHERE wp.id = plan_days.plan_id
          AND (public.is_admin(auth.uid()) OR wp.coach_id = auth.uid())
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM workout_plans wp
        WHERE wp.id = plan_days.plan_id
          AND (public.is_admin(auth.uid()) OR wp.coach_id = auth.uid())
    )
);

CREATE POLICY plan_day_workouts_select_scope ON plan_day_workouts
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM plan_days pd
        JOIN workout_plans wp ON wp.id = pd.plan_id
        WHERE pd.id = plan_day_workouts.plan_day_id
          AND (
              public.is_admin(auth.uid())
              OR wp.coach_id = auth.uid()
              OR EXISTS (
                  SELECT 1
                  FROM plan_assignments pa
                  WHERE pa.plan_id = wp.id
                    AND pa.user_id = auth.uid()
              )
          )
    )
);

CREATE POLICY plan_day_workouts_write_scope ON plan_day_workouts
FOR ALL
USING (
    EXISTS (
        SELECT 1
        FROM plan_days pd
        JOIN workout_plans wp ON wp.id = pd.plan_id
        WHERE pd.id = plan_day_workouts.plan_day_id
          AND (public.is_admin(auth.uid()) OR wp.coach_id = auth.uid())
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM plan_days pd
        JOIN workout_plans wp ON wp.id = pd.plan_id
        WHERE pd.id = plan_day_workouts.plan_day_id
          AND (public.is_admin(auth.uid()) OR wp.coach_id = auth.uid())
    )
);

CREATE POLICY plan_assignments_select_scope ON plan_assignments
FOR SELECT
USING (
    public.is_admin(auth.uid())
    OR user_id = auth.uid()
    OR EXISTS (
        SELECT 1
        FROM workout_plans wp
        WHERE wp.id = plan_assignments.plan_id
          AND wp.coach_id = auth.uid()
    )
);

CREATE POLICY plan_assignments_insert_scope ON plan_assignments
FOR INSERT
WITH CHECK (
    public.is_admin(auth.uid())
    OR EXISTS (
        SELECT 1
        FROM workout_plans wp
        WHERE wp.id = plan_assignments.plan_id
          AND wp.coach_id = auth.uid()
    )
);

CREATE POLICY plan_assignments_update_scope ON plan_assignments
FOR UPDATE
USING (
    public.is_admin(auth.uid())
    OR EXISTS (
        SELECT 1
        FROM workout_plans wp
        WHERE wp.id = plan_assignments.plan_id
          AND wp.coach_id = auth.uid()
    )
)
WITH CHECK (
    public.is_admin(auth.uid())
    OR EXISTS (
        SELECT 1
        FROM workout_plans wp
        WHERE wp.id = plan_assignments.plan_id
          AND wp.coach_id = auth.uid()
    )
);

CREATE POLICY plan_assignments_delete_scope ON plan_assignments
FOR DELETE
USING (
    public.is_admin(auth.uid())
    OR EXISTS (
        SELECT 1
        FROM workout_plans wp
        WHERE wp.id = plan_assignments.plan_id
          AND wp.coach_id = auth.uid()
    )
);

CREATE POLICY workout_sessions_select_scope ON workout_sessions
FOR SELECT
USING (
    public.is_admin(auth.uid())
    OR user_id = auth.uid()
    OR public.is_coach_of(auth.uid(), user_id)
);

CREATE POLICY workout_sessions_insert_scope ON workout_sessions
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()) OR user_id = auth.uid());

CREATE POLICY workout_sessions_update_scope ON workout_sessions
FOR UPDATE
USING (public.is_admin(auth.uid()) OR user_id = auth.uid())
WITH CHECK (public.is_admin(auth.uid()) OR user_id = auth.uid());

CREATE POLICY workout_sessions_delete_scope ON workout_sessions
FOR DELETE
USING (public.is_admin(auth.uid()) OR user_id = auth.uid());

CREATE POLICY exercise_logs_select_scope ON exercise_logs
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM workout_sessions ws
        WHERE ws.id = exercise_logs.session_id
          AND (
              public.is_admin(auth.uid())
              OR ws.user_id = auth.uid()
              OR public.is_coach_of(auth.uid(), ws.user_id)
          )
    )
);

CREATE POLICY exercise_logs_insert_scope ON exercise_logs
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM workout_sessions ws
        WHERE ws.id = exercise_logs.session_id
          AND (public.is_admin(auth.uid()) OR ws.user_id = auth.uid())
    )
);

CREATE POLICY exercise_logs_update_scope ON exercise_logs
FOR UPDATE
USING (
    EXISTS (
        SELECT 1
        FROM workout_sessions ws
        WHERE ws.id = exercise_logs.session_id
          AND (public.is_admin(auth.uid()) OR ws.user_id = auth.uid())
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM workout_sessions ws
        WHERE ws.id = exercise_logs.session_id
          AND (public.is_admin(auth.uid()) OR ws.user_id = auth.uid())
    )
);

CREATE POLICY exercise_logs_delete_scope ON exercise_logs
FOR DELETE
USING (
    EXISTS (
        SELECT 1
        FROM workout_sessions ws
        WHERE ws.id = exercise_logs.session_id
          AND (public.is_admin(auth.uid()) OR ws.user_id = auth.uid())
    )
);
