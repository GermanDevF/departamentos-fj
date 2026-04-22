-- Números de contrato de servicios por propiedad: agua, luz e internet.
-- Ejecutar con: node scripts/run-insforge-sql.mjs scripts/add-properties-servicios.sql

ALTER TABLE properties
ADD COLUMN IF NOT EXISTS contrato_agua     text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS contrato_luz      text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS contrato_internet text DEFAULT NULL;
