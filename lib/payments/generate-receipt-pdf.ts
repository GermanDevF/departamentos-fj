import type { PaymentRow } from "@/lib/payments/actions";

export async function downloadReceiptPDF(payment: PaymentRow): Promise<void> {
  const [{ createElement }, { pdf }, { PaymentReceiptPDF }] = await Promise.all([
    import("react"),
    import("@react-pdf/renderer"),
    import("@/components/payments/payment-receipt-pdf"),
  ]);

  // @react-pdf/renderer's pdf() expects ReactElement<DocumentProps>.
  // PaymentReceiptPDF returns a <Document> which satisfies that at runtime;
  // we cast to satisfy the stricter generic parameter.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = createElement(PaymentReceiptPDF, { payment }) as any;
  const blob = await pdf(element).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `recibo-${payment.id.slice(0, 8)}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
