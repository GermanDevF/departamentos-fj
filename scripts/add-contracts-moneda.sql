-- Moneda del contrato: MXN (peso mexicano) o USD (dólar).
-- Ejecutar con: node scripts/run-insforge-sql.mjs scripts/add-contracts-moneda.sql

ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS moneda text NOT NULL DEFAULT 'MXN';
