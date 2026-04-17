import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";
import type { PaymentRow } from "@/lib/payments/actions";
import { formatPaymentAmount } from "@/lib/payments/format-currency";
import { METODOS_PAGO } from "@/types";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const TIPOS_DURACION_LABELS: Record<string, string> = {
  horas: "Horas",
  dias: "Días",
  semanas: "Semanas",
  meses: "Meses",
  indefinido: "Indefinido",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#111827",
    backgroundColor: "#ffffff",
    padding: 40,
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
    paddingBottom: 16,
    borderBottom: "2px solid #10b981",
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#10b981",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 10,
    color: "#6b7280",
  },
  headerRight: {
    alignItems: "flex-end",
  },
  receiptNumber: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#374151",
    marginBottom: 2,
  },
  receiptDate: {
    fontSize: 9,
    color: "#6b7280",
  },
  // Section
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottom: "1px solid #e5e7eb",
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    width: 110,
    color: "#6b7280",
    fontSize: 10,
  },
  value: {
    flex: 1,
    color: "#111827",
    fontSize: 10,
  },
  // Payment highlight box
  paymentBox: {
    backgroundColor: "#f0fdf4",
    borderRadius: 6,
    padding: 14,
    marginBottom: 20,
    border: "1px solid #a7f3d0",
  },
  paymentBoxTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#059669",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  paymentAmount: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: "#059669",
    marginBottom: 10,
  },
  paymentRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  paymentLabel: {
    width: 110,
    color: "#6b7280",
    fontSize: 10,
  },
  paymentValue: {
    flex: 1,
    color: "#111827",
    fontSize: 10,
  },
  // Notes
  notesBox: {
    backgroundColor: "#f9fafb",
    borderRadius: 4,
    padding: 8,
    marginTop: 4,
  },
  notesText: {
    color: "#374151",
    fontSize: 9,
    lineHeight: 1.4,
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: "1px solid #e5e7eb",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 8,
    color: "#9ca3af",
  },
  footerBrand: {
    fontSize: 8,
    color: "#9ca3af",
    fontFamily: "Helvetica-Bold",
  },
});

interface PaymentReceiptPDFProps {
  payment: PaymentRow;
}

export function PaymentReceiptPDF({ payment }: PaymentReceiptPDFProps) {
  const contract = payment.contracts;
  const property = contract?.properties;
  const tenant = contract?.tenants;

  const emissionDate = new Date().toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const paymentDate = new Date(
    payment.fecha_pago + "T00:00:00",
  ).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const periodoLabel = `${MESES[payment.periodo_mes - 1]} ${payment.periodo_anio}`;
  const receiptId = `RECIBO-${payment.id.slice(0, 8).toUpperCase()}`;

  const metodoLabel =
    METODOS_PAGO.find((m) => m.value === payment.metodo_pago)?.label ??
    payment.metodo_pago;

  const duracionLabel =
    contract?.tipo_duracion === "indefinido"
      ? "Indefinido"
      : `${contract?.duracion_cantidad} ${TIPOS_DURACION_LABELS[contract?.tipo_duracion ?? ""] ?? contract?.tipo_duracion}`;

  return (
    <Document title={receiptId} author="Sistema de Rentas">
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>RECIBO DE PAGO</Text>
            <Text style={styles.headerSubtitle}>
              Sistema de administración de rentas
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.receiptNumber}>{receiptId}</Text>
            <Text style={styles.receiptDate}>Emitido el {emissionDate}</Text>
          </View>
        </View>

        {/* Payment highlight */}
        <View style={styles.paymentBox}>
          <Text style={styles.paymentBoxTitle}>Monto del pago</Text>
          <Text style={styles.paymentAmount}>
            {formatPaymentAmount(payment.monto, payment.moneda)}
          </Text>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Periodo:</Text>
            <Text style={styles.paymentValue}>{periodoLabel}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Fecha de pago:</Text>
            <Text style={styles.paymentValue}>{paymentDate}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Método:</Text>
            <Text style={styles.paymentValue}>{metodoLabel}</Text>
          </View>
          {payment.notas && (
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Notas:</Text>
              <View style={styles.notesBox}>
                <Text style={styles.notesText}>{payment.notas}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Tenant */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inquilino</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nombre:</Text>
            <Text style={styles.value}>{tenant?.nombre ?? "—"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Teléfono:</Text>
            <Text style={styles.value}>{tenant?.telefono ?? "—"}</Text>
          </View>
          {tenant?.email && (
            <View style={styles.row}>
              <Text style={styles.label}>Correo:</Text>
              <Text style={styles.value}>{tenant.email}</Text>
            </View>
          )}
        </View>

        {/* Property */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Propiedad</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nombre:</Text>
            <Text style={styles.value}>{property?.nombre ?? "—"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Dirección:</Text>
            <Text style={styles.value}>{property?.direccion ?? "—"}</Text>
          </View>
        </View>

        {/* Contract */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contrato</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Inicio:</Text>
            <Text style={styles.value}>
              {contract?.fecha_inicio
                ? new Date(
                    contract.fecha_inicio + "T00:00:00",
                  ).toLocaleDateString("es-MX")
                : "—"}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Duración:</Text>
            <Text style={styles.value}>{duracionLabel}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Renta mensual:</Text>
            <Text style={styles.value}>
              {formatPaymentAmount(contract?.precio_mensual ?? 0, "MXN")}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Día de pago:</Text>
            <Text style={styles.value}>Día {contract?.dia_pago ?? "—"}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Comprobante generado automáticamente. No requiere firma.
          </Text>
          <Text style={styles.footerBrand}>Rentas FJ</Text>
        </View>
      </Page>
    </Document>
  );
}
