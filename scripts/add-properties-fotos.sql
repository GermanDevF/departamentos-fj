-- Agrega columna JSONB para almacenar galería de fotos de cada propiedad.
-- Cada entrada: { "url": "...", "storage_key": "..." }
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS fotos jsonb DEFAULT '[]'::jsonb;
