-- =============================================================================
-- Realtime: notificar a administradores cuando cambian solicitudes pendientes
-- (user_profiles con is_active = false o cambios de is_active).
--
-- Requisitos: InsForge realtime habilitado en el proyecto.
-- Ejecutar con:
--   npx @insforge/cli db query "$(cat scripts/realtime-pending-user-notifications.sql)"
-- (Windows: pegar el contenido en la CLI o usar un archivo.)
-- =============================================================================

-- Patrón de canal (ajusta si tu proyecto usa otro esquema en realtime.channels)
INSERT INTO realtime.channels (pattern, description, enabled)
SELECT
  'admin:pending-access',
  'Eventos de solicitudes de acceso pendientes (user_profiles)',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM realtime.channels WHERE pattern = 'admin:pending-access'
);

CREATE OR REPLACE FUNCTION public.notify_admin_pending_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM realtime.publish(
    'admin:pending-access',
    'pending_user_changed',
    jsonb_build_object(
      'profile_id', NEW.id,
      'user_id', NEW.user_id,
      'is_active', NEW.is_active,
      'operation', TG_OP
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_profiles_pending_notify_insert ON public.user_profiles;

CREATE TRIGGER user_profiles_pending_notify_insert
  AFTER INSERT ON public.user_profiles
  FOR EACH ROW
  WHEN (NEW.is_active IS FALSE)
  EXECUTE FUNCTION public.notify_admin_pending_profile();

DROP TRIGGER IF EXISTS user_profiles_pending_notify_update ON public.user_profiles;

CREATE TRIGGER user_profiles_pending_notify_update
  AFTER UPDATE ON public.user_profiles
  FOR EACH ROW
  WHEN (OLD.is_active IS DISTINCT FROM NEW.is_active)
  EXECUTE FUNCTION public.notify_admin_pending_profile();
