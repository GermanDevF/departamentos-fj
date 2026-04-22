-- Tipo de cambio para pagos en moneda distinta a la del contrato.
-- Representa cuántas unidades de la moneda del contrato equivale 1 unidad de la moneda del pago.
-- NULL cuando el pago es en la misma moneda que el contrato.
-- Ejecutar con: node scripts/run-insforge-sql.mjs scripts/add-payments-tipo-cambio.sql

ALTER TABLE payments
ADD COLUMN IF NOT EXISTS tipo_cambio numeric NULL;
