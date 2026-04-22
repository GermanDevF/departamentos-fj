-- Agrega columnas para almacenar foto de INE (frente y reverso) de cada inquilino.
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS ine_frontal_url  text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ine_frontal_key  text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ine_trasera_url  text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ine_trasera_key  text DEFAULT NULL;
