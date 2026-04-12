-- =============================================================================
-- Trigger: auto-crear un user_profile por cada nuevo usuario en auth.users
--
-- Red de seguridad para cualquier alta (email, OAuth futuro, API): si la app
-- no pudo hacer upsert por falta de JWT, aquí queda staff + pendiente.
--
-- Ejecutar con:
--   npx @insforge/cli db query "$(cat scripts/setup-profile-trigger.sql)"
--
-- O línea por línea copiando cada bloque en:
--   npx @insforge/cli db query "<SQL>"
-- =============================================================================

-- 1. Función que se ejecuta tras cada INSERT en auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, role, is_active)
  VALUES (NEW.id, 'staff', false)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 2. Trigger en auth.users (idempotente: elimina si ya existe)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
