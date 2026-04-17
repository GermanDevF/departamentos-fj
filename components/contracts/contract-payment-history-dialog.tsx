"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  IconCheck,
  IconClock,
  IconCalendar,
  IconCoin,
  IconUser,
  IconHome,
} from "@tabler/icons-react";
import { getPaymentHistoryByContrato } from "@/lib/payments/actions";
import type {
  ContractPaymentHistory,
  ContractPaymentPeriod,
} from "@/lib/payments/actions";
import type { ContractRow } from "@/lib/contracts/actions";
import { formatPaymentAmount } from "@/lib/payments/format-currency";
import { METODOS_PAGO } from "@/types";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

interface ContractPaymentHistoryDialogProps {
  contract: ContractRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContractPaymentHistoryDialog({
  contract,
  open,
  onOpenChange,
}: ContractPaymentHistoryDialogProps) {
  const [history, setHistory] = useState<ContractPaymentHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    return (
      METODOS_PAGO.find((m) => m.value === value)?.label ?? value
    );
  }

  return (
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
                  {formatPaymentAmount(contract.precio_mensual, "MXN")} /
                  mes — día {contract.dia_pago}
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
              <div className="grid grid-cols-2 gap-3 p-6 pb-4">
                <div className="flex items-center gap-3 rounded-lg border bg-emerald-500/5 border-emerald-500/20 px-4 py-3">
                  <IconCheck className="size-5 shrink-0 text-emerald-500" />
                  <div>
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                      {history.totalPagados}
                    </p>
                    <p className="text-xs text-muted-foreground">Pagados</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border bg-amber-500/5 border-amber-500/20 px-4 py-3">
                  <IconClock className="size-5 shrink-0 text-amber-500" />
                  <div>
                    <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                      {history.totalPendientes}
                    </p>
                    <p className="text-xs text-muted-foreground">Pendientes</p>
                  </div>
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
                            getMetodoLabel={getMetodoLabel}
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
  );
}

function PeriodCard({
  periodo,
  getMetodoLabel,
}: {
  periodo: ContractPaymentPeriod;
  getMetodoLabel: (v: string) => string;
}) {
  const isPaid = periodo.estado === "pagado";

  return (
    <div
      className={`rounded-lg border px-4 py-3 transition-colors ${
        isPaid
          ? "border-emerald-500/20 bg-emerald-500/5"
          : "border-amber-500/20 bg-amber-500/5"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
              isPaid
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
            }`}
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
            {!isPaid && (
              <p className="text-xs text-muted-foreground">
                Vencimiento:{" "}
                {new Date(periodo.fechaVencimiento + "T00:00:00").toLocaleDateString("es-MX")}
              </p>
            )}
            {isPaid && periodo.pago && (
              <p className="text-xs text-muted-foreground">
                {new Date(periodo.pago.fecha_pago + "T00:00:00").toLocaleDateString("es-MX")} ·{" "}
                {getMetodoLabel(periodo.pago.metodo_pago)}
                {periodo.pago.notas && ` · ${periodo.pago.notas}`}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Badge
            className={
              isPaid
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
            }
            variant="outline"
          >
            {isPaid ? "Pagado" : "Pendiente"}
          </Badge>
          {isPaid && periodo.pago && (
            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              {formatPaymentAmount(periodo.pago.monto, periodo.pago.moneda)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
