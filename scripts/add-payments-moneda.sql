-- Moneda del pago: MXN (peso mexicano) o USD (dólar).
-- Ejecutar con: node scripts/run-insforge-sql.mjs scripts/add-payments-moneda.sql

ALTER TABLE payments
ADD COLUMN IF NOT EXISTS moneda text NOT NULL DEFAULT 'MXN';
