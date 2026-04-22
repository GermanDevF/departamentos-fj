CREATE TABLE IF NOT EXISTS public.direcciones (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre           text NOT NULL,
  calle            text NOT NULL,
  numero_exterior  text NOT NULL,
  numero_interior  text,
  colonia          text NOT NULL,
  ciudad           text NOT NULL,
  estado           text NOT NULL,
  cp               text,
  notas            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS direcciones_user_id_idx ON public.direcciones(user_id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS direcciones_set_updated_at ON public.direcciones;
CREATE TRIGGER direcciones_set_updated_at
  BEFORE UPDATE ON public.direcciones
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS direccion_id uuid REFERENCES public.direcciones(id) ON DELETE SET NULL;

ALTER TABLE public.direcciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY direcciones_select_active ON public.direcciones
  FOR SELECT TO authenticated
  USING (public.user_profiles_is_active_authenticated_user());

CREATE POLICY direcciones_insert_admin ON public.direcciones
  FOR INSERT TO authenticated
  WITH CHECK (public.user_profiles_is_active_admin());

CREATE POLICY direcciones_update_admin ON public.direcciones
  FOR UPDATE TO authenticated
  USING (public.user_profiles_is_active_admin())
  WITH CHECK (public.user_profiles_is_active_admin());

CREATE POLICY direcciones_delete_admin ON public.direcciones
  FOR DELETE TO authenticated
  USING (public.user_profiles_is_active_admin());
