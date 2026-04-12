/* shared-business-data-rls.sql
   Datos de negocio compartidos (empresa): propiedades, inquilinos, contratos y pagos.
   - SELECT: cualquier usuario autenticado con perfil activo (admin o staff).
   - INSERT/UPDATE/DELETE: solo admin activo (coincide con requireAdmin() en la app).

   Ejecutar desde la raíz:
     node scripts/run-insforge-sql.mjs scripts/shared-business-data-rls.sql
     npm run db:shared-business-rls

   Recomendado haber aplicado antes fix-user-profiles-rls-recursion.sql; si no,
   las funciones de abajo quedan definidas aquí de forma idempotente.
*/

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

DO $$
DECLARE
  r RECORD;
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['properties', 'tenants', 'contracts', 'payments']
  LOOP
    FOR r IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = t
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, t);
    END LOOP;
  END LOOP;
END $$;

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- properties
CREATE POLICY properties_select_active ON public.properties
  FOR SELECT TO authenticated
  USING (public.user_profiles_is_active_authenticated_user());

CREATE POLICY properties_insert_admin ON public.properties
  FOR INSERT TO authenticated
  WITH CHECK (public.user_profiles_is_active_admin());

CREATE POLICY properties_update_admin ON public.properties
  FOR UPDATE TO authenticated
  USING (public.user_profiles_is_active_admin())
  WITH CHECK (public.user_profiles_is_active_admin());

CREATE POLICY properties_delete_admin ON public.properties
  FOR DELETE TO authenticated
  USING (public.user_profiles_is_active_admin());

-- tenants
CREATE POLICY tenants_select_active ON public.tenants
  FOR SELECT TO authenticated
  USING (public.user_profiles_is_active_authenticated_user());

CREATE POLICY tenants_insert_admin ON public.tenants
  FOR INSERT TO authenticated
  WITH CHECK (public.user_profiles_is_active_admin());

CREATE POLICY tenants_update_admin ON public.tenants
  FOR UPDATE TO authenticated
  USING (public.user_profiles_is_active_admin())
  WITH CHECK (public.user_profiles_is_active_admin());

CREATE POLICY tenants_delete_admin ON public.tenants
  FOR DELETE TO authenticated
  USING (public.user_profiles_is_active_admin());

-- contracts
CREATE POLICY contracts_select_active ON public.contracts
  FOR SELECT TO authenticated
  USING (public.user_profiles_is_active_authenticated_user());

CREATE POLICY contracts_insert_admin ON public.contracts
  FOR INSERT TO authenticated
  WITH CHECK (public.user_profiles_is_active_admin());

CREATE POLICY contracts_update_admin ON public.contracts
  FOR UPDATE TO authenticated
  USING (public.user_profiles_is_active_admin())
  WITH CHECK (public.user_profiles_is_active_admin());

CREATE POLICY contracts_delete_admin ON public.contracts
  FOR DELETE TO authenticated
  USING (public.user_profiles_is_active_admin());

-- payments
CREATE POLICY payments_select_active ON public.payments
  FOR SELECT TO authenticated
  USING (public.user_profiles_is_active_authenticated_user());

CREATE POLICY payments_insert_admin ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK (public.user_profiles_is_active_admin());

CREATE POLICY payments_update_admin ON public.payments
  FOR UPDATE TO authenticated
  USING (public.user_profiles_is_active_admin())
  WITH CHECK (public.user_profiles_is_active_admin());

CREATE POLICY payments_delete_admin ON public.payments
  FOR DELETE TO authenticated
  USING (public.user_profiles_is_active_admin());
