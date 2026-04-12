/* fix-user-profiles-rls-recursion.sql
   RLS recursion on user_profiles: SECURITY DEFINER RPCs and policies.
   Ejecutar: npm run db:fix-user-profiles-rls (o node scripts/run-insforge-sql.mjs <este archivo>)
*/

/* 0) RPC listar perfiles (admin). App: rpc("admin_list_user_profiles") */
CREATE OR REPLACE FUNCTION public.admin_list_user_profiles()
RETURNS SETOF public.user_profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT up.*
  FROM public.user_profiles up
  WHERE EXISTS (
    SELECT 1
    FROM public.user_profiles chk
    WHERE chk.user_id = auth.uid()
      AND chk.role = 'admin'
      AND chk.is_active IS TRUE
  )
  ORDER BY up.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.admin_list_user_profiles() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_user_profiles() TO authenticated;

/* 0b) Listado admin con email/nombre desde auth.users. App: rpc("admin_list_app_users") */
CREATE OR REPLACE FUNCTION public.admin_list_app_users()
RETURNS TABLE (
  id text,
  user_id text,
  email text,
  name text,
  role text,
  is_active boolean,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT
    up.id::text,
    up.user_id::text,
    COALESCE(u.email, '')::text AS email,
    /* InsForge: nombre en JSON profile (no raw_user_meta_data de Supabase). */
    NULLIF(TRIM(COALESCE(u.profile->>'name', '')), '')::text AS name,
    up.role::text,
    up.is_active,
    up.created_at
  FROM public.user_profiles up
  LEFT JOIN auth.users u ON u.id = up.user_id
  WHERE EXISTS (
    SELECT 1
    FROM public.user_profiles chk
    WHERE chk.user_id = auth.uid()
      AND chk.role = 'admin'
      AND chk.is_active IS TRUE
  )
  ORDER BY up.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.admin_list_app_users() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_app_users() TO authenticated;

/* 0c) Mismo resultado que admin_list_app_users (todos los perfiles, cualquier role en filas).
      Quién puede llamar: cualquier usuario con perfil activo (admin o staff), no solo admin.
      App: rpc("list_app_users_with_identity") */
CREATE OR REPLACE FUNCTION public.list_app_users_with_identity()
RETURNS TABLE (
  id text,
  user_id text,
  email text,
  name text,
  role text,
  is_active boolean,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT
    up.id::text,
    up.user_id::text,
    COALESCE(u.email, '')::text AS email,
    NULLIF(TRIM(COALESCE(u.profile->>'name', '')), '')::text AS name,
    up.role::text,
    up.is_active,
    up.created_at
  FROM public.user_profiles up
  LEFT JOIN auth.users u ON u.id = up.user_id
  WHERE EXISTS (
    SELECT 1
    FROM public.user_profiles chk
    WHERE chk.user_id = auth.uid()
  )
  ORDER BY up.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.list_app_users_with_identity() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_app_users_with_identity() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_count_pending_user_profiles()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(COUNT(*)::integer, 0)
  FROM public.user_profiles up
  WHERE up.is_active IS FALSE
    AND EXISTS (
      SELECT 1
      FROM public.user_profiles chk
      WHERE chk.user_id = auth.uid()
        AND chk.role = 'admin'
        AND chk.is_active IS TRUE
    );
$$;

REVOKE ALL ON FUNCTION public.admin_count_pending_user_profiles() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_count_pending_user_profiles() TO authenticated;

-- 1) Función: ¿el usuario actual es admin activo? (sin recursión)
CREATE OR REPLACE FUNCTION public.user_profiles_is_active_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles up
    WHERE up.user_id = auth.uid()
      AND up.role = 'admin'
      AND up.is_active IS TRUE
  );
$$;

-- 2) Opcional: staff activo (si tus políticas lo necesitan)
CREATE OR REPLACE FUNCTION public.user_profiles_is_active_authenticated_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles up
    WHERE up.user_id = auth.uid()
      AND up.is_active IS TRUE
  );
$$;

REVOKE ALL ON FUNCTION public.user_profiles_is_active_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_profiles_is_active_admin() TO authenticated;

REVOKE ALL ON FUNCTION public.user_profiles_is_active_authenticated_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_profiles_is_active_authenticated_user() TO authenticated;

-- 3) Quitar políticas actuales de user_profiles (evitar duplicados y recursión)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_profiles', r.policyname);
  END LOOP;
END $$;

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 4) Políticas nuevas (sin subconsultas directas a user_profiles en la política)

-- Lectura: la propia fila o un admin activo
CREATE POLICY user_profiles_select_authenticated
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.user_profiles_is_active_admin()
  );

-- Alta: solo la fila propia o admin (ajusta si el registro lo crea solo un trigger/service)
CREATE POLICY user_profiles_insert_authenticated
  ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR public.user_profiles_is_active_admin()
  );

-- Actualización: propia fila o admin
CREATE POLICY user_profiles_update_authenticated
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.user_profiles_is_active_admin()
  )
  WITH CHECK (
    user_id = auth.uid()
    OR public.user_profiles_is_active_admin()
  );

-- Borrado: solo admin (como en tu app deleteUser)
CREATE POLICY user_profiles_delete_admin
  ON public.user_profiles
  FOR DELETE
  TO authenticated
  USING (public.user_profiles_is_active_admin());

-- Si necesitas que anon inserte (no recomendado), añade políticas TO anon según tu flujo.
