import type { PaymentMoneda } from "@/types";

export function formatPaymentAmount(
  amount: number,
  moneda: PaymentMoneda | string | null | undefined,
): string {
  const code: PaymentMoneda = moneda === "USD" ? "USD" : "MXN";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
