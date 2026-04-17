"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  IconCheck,
  IconClock,
  IconCalendar,
  IconCoin,
  IconUser,
  IconHome,
  IconPlus,
  IconChevronDown,
  IconChevronUp,
  IconFileDownload,
  IconLoader2,
} from "@tabler/icons-react";
import {
  getPaymentHistoryByContrato,
  createPayment,
} from "@/lib/payments/actions";
import type {
  ContractPaymentHistory,
  ContractPaymentPeriod,
  PaymentRow,
} from "@/lib/payments/actions";
import type { ContractRow } from "@/lib/contracts/actions";
import { formatPaymentAmount } from "@/lib/payments/format-currency";
import { PaymentDialog } from "@/components/payments/payment-dialog";
import { METODOS_PAGO } from "@/types";
import type { Payment, CreatePaymentInput } from "@/types";
import { toast } from "sonner";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

interface ContractPaymentHistoryDialogProps {
  contract: ContractRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin?: boolean;
}

export function ContractPaymentHistoryDialog({
  contract,
  open,
  onOpenChange,
  isAdmin,
}: ContractPaymentHistoryDialogProps) {
  const [history, setHistory] = useState<ContractPaymentHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Abono dialog state
  const [abonoOpen, setAbonoOpen] = useState(false);
  const [abonoPrefill, setAbonoPrefill] = useState<{
    contrato_id?: string;
    periodo_mes?: number;
    periodo_anio?: number;
    monto?: number;
  } | undefined>(undefined);
  const [abonoRemaining, setAbonoRemaining] = useState<number | undefined>();

  function refreshHistory() {
    if (!contract) return;
    const contractId = contract.id;
    setHistory(null);
    setError(null);
    setLoading(true);
    getPaymentHistoryByContrato(contractId).then((result) => {
      if (result.success && result.data) {
        setHistory(result.data);
        setError(null);
      } else {
        setHistory(null);
        setError(result.error ?? "Error al cargar historial.");
      }
      setLoading(false);
    });
  }

  useEffect(() => {
    if (!open || !contract) return;
    let cancelled = false;
    const contractId = contract.id;

    queueMicrotask(() => {
      if (cancelled) return;
      setHistory(null);
      setError(null);
      setLoading(true);

      getPaymentHistoryByContrato(contractId).then((result) => {
        if (cancelled) return;
        if (result.success && result.data) {
          setHistory(result.data);
          setError(null);
        } else {
          setHistory(null);
          setError(result.error ?? "Error al cargar historial.");
        }
        setLoading(false);
      });
    });

    return () => {
      cancelled = true;
    };
  }, [open, contract]);

  function handleOpenAbono(periodo: ContractPaymentPeriod) {
    if (!contract) return;
    setAbonoPrefill({
      contrato_id: contract.id,
      periodo_mes: periodo.mes,
      periodo_anio: periodo.anio,
      monto: periodo.saldoPendiente > 0 ? periodo.saldoPendiente : undefined,
    });
    setAbonoRemaining(periodo.saldoPendiente > 0 ? periodo.saldoPendiente : undefined);
    setAbonoOpen(true);
  }

  async function handleAbonoSubmit(data: CreatePaymentInput) {
    const result = await createPayment(data);
    if (result.success) {
      toast.success("Pago registrado");
      refreshHistory();
    } else {
      toast.error(result.error ?? "Error al guardar");
    }
    return result;
  }

  // Group periods by year descending
  const periodosPorAnio = history
    ? history.periodos.reduce<Record<number, ContractPaymentPeriod[]>>(
        (acc, p) => {
          if (!acc[p.anio]) acc[p.anio] = [];
          acc[p.anio].push(p);
          return acc;
        },
        {},
      )
    : {};

  const anios = Object.keys(periodosPorAnio)
    .map(Number)
    .sort((a, b) => b - a);

  function getMetodoLabel(value: string) {
    return METODOS_PAGO.find((m) => m.value === value)?.label ?? value;
  }

  function toPaymentRow(pago: Payment): PaymentRow {
    if (!contract) return pago as unknown as PaymentRow;
    return {
      ...pago,
      contracts: {
        ...contract,
        properties: contract.properties,
        tenants: contract.tenants,
      },
    };
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-lg" side="right">
          <SheetHeader className="border-b px-6 py-5">
            <SheetTitle className="text-lg">Historial de pagos</SheetTitle>
            {contract && (
              <div className="mt-1 space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <IconHome className="size-3.5 shrink-0" />
                  <span className="font-medium text-foreground">
                    {contract.properties?.nombre ?? "—"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <IconUser className="size-3.5 shrink-0" />
                  <span>{contract.tenants?.nombre ?? "—"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <IconCoin className="size-3.5 shrink-0" />
                  <span>
                    {formatPaymentAmount(contract.precio_mensual, "MXN")} / mes
                    — día {contract.dia_pago}
                  </span>
                </div>
              </div>
            )}
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="space-y-3 p-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center p-12 text-sm text-destructive">
                {error}
              </div>
            )}

            {history && !loading && (
              <>
                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 p-6 pb-4">
                  <div className="flex flex-col items-center gap-1 rounded-lg border bg-emerald-500/5 border-emerald-500/20 px-3 py-3">
                    <IconCheck className="size-4 text-emerald-500" />
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                      {history.totalPagados}
                    </p>
                    <p className="text-xs text-muted-foreground">Pagados</p>
                  </div>
                  <div className="flex flex-col items-center gap-1 rounded-lg border bg-amber-500/5 border-amber-500/20 px-3 py-3">
                    <IconClock className="size-4 text-amber-500" />
                    <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                      {history.totalParciales}
                    </p>
                    <p className="text-xs text-muted-foreground">Parciales</p>
                  </div>
                  <div className="flex flex-col items-center gap-1 rounded-lg border bg-rose-500/5 border-rose-500/20 px-3 py-3">
                    <IconCalendar className="size-4 text-rose-500" />
                    <p className="text-xl font-bold text-rose-600 dark:text-rose-400">
                      {history.totalPendientes}
                    </p>
                    <p className="text-xs text-muted-foreground">Pendientes</p>
                  </div>
                </div>

                {history.periodos.length === 0 && (
                  <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                    <IconCalendar className="size-8 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      No hay períodos registrados aún.
                    </p>
                  </div>
                )}

                {/* Periods grouped by year */}
                <div className="px-6 pb-6 space-y-6">
                  {anios.map((anio) => (
                    <div key={anio}>
                      <div className="mb-3 flex items-center gap-2">
                        <span className="text-sm font-semibold text-muted-foreground">
                          {anio}
                        </span>
                        <Separator className="flex-1" />
                      </div>
                      <div className="space-y-2">
                        {periodosPorAnio[anio]
                          .slice()
                          .reverse()
                          .map((periodo) => (
                            <PeriodCard
                              key={`${periodo.anio}-${periodo.mes}`}
                              periodo={periodo}
                              precioPorMes={history.contrato.precio_mensual}
                              getMetodoLabel={getMetodoLabel}
                              isAdmin={isAdmin}
                              onAddAbono={() => handleOpenAbono(periodo)}
                              onDownloadReceipt={
                                periodo.pagos.length > 0
                                  ? (pago) => toPaymentRow(pago)
                                  : undefined
                              }
                            />
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {isAdmin && contract && (
        <PaymentDialog
          open={abonoOpen}
          onOpenChange={(open) => {
            setAbonoOpen(open);
          }}
          contracts={[contract]}
          onSubmit={handleAbonoSubmit}
          prefilledValues={abonoPrefill}
          lockedFields={{ contrato: true, period: true }}
          remainingBalance={abonoRemaining}
          submitLabel={
            abonoPrefill?.monto != null &&
            abonoRemaining != null &&
            abonoPrefill.monto < abonoRemaining
              ? "Registrar abono"
              : "Registrar pago"
          }
        />
      )}
    </>
  );
}

function PeriodCard({
  periodo,
  getMetodoLabel,
  isAdmin,
  onAddAbono,
  onDownloadReceipt,
}: {
  periodo: ContractPaymentPeriod;
  precioPorMes: number;
  getMetodoLabel: (v: string) => string;
  isAdmin?: boolean;
  onAddAbono?: () => void;
  onDownloadReceipt?: (pago: Payment) => PaymentRow;
}) {
  const [expanded, setExpanded] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  const isPaid = periodo.estado === "pagado";
  const isParcial = periodo.estado === "parcial";
  const isPendiente = periodo.estado === "pendiente";

  const borderClass = isPaid
    ? "border-emerald-500/20 bg-emerald-500/5"
    : isParcial
      ? "border-amber-500/20 bg-amber-500/5"
      : "border-rose-500/20 bg-rose-500/5";

  const iconClass = isPaid
    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
    : isParcial
      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
      : "bg-rose-500/15 text-rose-600 dark:text-rose-400";

  const badgeClass = isPaid
    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
    : isParcial
      ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
      : "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400";

  const badgeLabel = isPaid ? "Pagado" : isParcial ? "Parcial" : "Pendiente";

  async function handleDownload(pago: Payment) {
    if (!onDownloadReceipt) return;
    setDownloading(pago.id);
    try {
      const paymentRow = onDownloadReceipt(pago);
      const { downloadReceiptPDF } = await import(
        "@/lib/payments/generate-receipt-pdf"
      );
      await downloadReceiptPDF(paymentRow);
    } catch {
      toast.error("Error al generar el recibo.");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className={`rounded-lg border px-4 py-3 transition-colors ${borderClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex size-8 shrink-0 items-center justify-center rounded-full ${iconClass}`}
          >
            {isPaid ? (
              <IconCheck className="size-4" />
            ) : (
              <IconClock className="size-4" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium">
              {MESES[periodo.mes - 1]} {periodo.anio}
            </p>
            {isPendiente && (
              <p className="text-xs text-muted-foreground">
                Vencimiento:{" "}
                {new Date(
                  periodo.fechaVencimiento + "T00:00:00",
                ).toLocaleDateString("es-MX")}
              </p>
            )}
            {(isPaid || isParcial) && (
              <p className="text-xs text-muted-foreground">
                {isParcial
                  ? `Saldo restante: ${formatPaymentAmount(periodo.saldoPendiente, "MXN")}`
                  : `${periodo.pagos.length} pago${periodo.pagos.length > 1 ? "s" : ""}`}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          <Badge className={badgeClass} variant="outline">
            {badgeLabel}
          </Badge>
          {(isPaid || isParcial) && (
            <span
              className={`text-sm font-semibold ${
                isPaid
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-amber-600 dark:text-amber-400"
              }`}
            >
              {formatPaymentAmount(
                periodo.totalPagado,
                periodo.pagos[0]?.moneda ?? "MXN",
              )}
            </span>
          )}
        </div>
      </div>

      {/* Actions row */}
      {(isAdmin && !isPaid) || periodo.pagos.length > 0 ? (
        <div className="mt-3 flex items-center justify-between gap-2">
          {periodo.pagos.length > 1 && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1 px-2 text-xs text-muted-foreground"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? (
                <IconChevronUp className="size-3.5" />
              ) : (
                <IconChevronDown className="size-3.5" />
              )}
              {expanded ? "Ocultar" : `Ver ${periodo.pagos.length} pagos`}
            </Button>
          )}
          {periodo.pagos.length === 1 && onDownloadReceipt && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1 px-2 text-xs text-muted-foreground"
              disabled={downloading === periodo.pagos[0].id}
              onClick={() => handleDownload(periodo.pagos[0])}
            >
              {downloading === periodo.pagos[0].id ? (
                <IconLoader2 className="size-3.5 animate-spin" />
              ) : (
                <IconFileDownload className="size-3.5" />
              )}
              Recibo
            </Button>
          )}
          {isAdmin && !isPaid && onAddAbono && (
            <Button
              size="sm"
              variant="outline"
              className="ml-auto h-7 gap-1 px-2 text-xs"
              onClick={onAddAbono}
            >
              <IconPlus className="size-3.5" />
              {isPendiente ? "Registrar pago" : "Registrar abono"}
            </Button>
          )}
        </div>
      ) : null}

      {/* Expanded individual payments */}
      {expanded && periodo.pagos.length > 1 && (
        <div className="mt-3 space-y-1.5 border-t pt-3">
          {periodo.pagos.map((pago) => (
            <div
              key={pago.id}
              className="flex items-center justify-between text-xs"
            >
              <span className="text-muted-foreground">
                {new Date(pago.fecha_pago + "T00:00:00").toLocaleDateString(
                  "es-MX",
                )}{" "}
                · {getMetodoLabel(pago.metodo_pago)}
                {pago.notas ? ` · ${pago.notas}` : ""}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {formatPaymentAmount(pago.monto, pago.moneda)}
                </span>
                {onDownloadReceipt && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-6"
                    disabled={downloading === pago.id}
                    onClick={() => handleDownload(pago)}
                  >
                    {downloading === pago.id ? (
                      <IconLoader2 className="size-3 animate-spin" />
                    ) : (
                      <IconFileDownload className="size-3" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
