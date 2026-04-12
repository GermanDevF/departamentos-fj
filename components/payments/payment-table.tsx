"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import { METODOS_PAGO } from "@/types";
import { formatPaymentAmount } from "@/lib/payments/format-currency";
import type { PaymentRow } from "@/lib/payments/actions";

const MESES_CORTO = [
  "", "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

interface PaymentTableProps {
  payments: PaymentRow[];
  loading: boolean;
  onEdit?: (payment: PaymentRow) => void;
  onDelete?: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export function PaymentTable({
  payments,
  loading,
  onEdit,
  onDelete,
}: PaymentTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<PaymentRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteTarget || !onDelete) return;
    setDeleting(true);
    await onDelete(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
  }

  const hasActions = !!onEdit || !!onDelete;

  function methodLabel(value: string) {
    return METODOS_PAGO.find((m) => m.value === value)?.label ?? value;
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
        <p className="text-muted-foreground">No hay pagos registrados.</p>
        <p className="text-sm text-muted-foreground">
          Registra tu primer pago para comenzar.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Propiedad</TableHead>
              <TableHead className="hidden md:table-cell">Inquilino</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead className="hidden sm:table-cell">Periodo</TableHead>
              <TableHead className="hidden lg:table-cell">Fecha pago</TableHead>
              <TableHead className="hidden sm:table-cell">Método</TableHead>
              {hasActions && (
                <TableHead className="w-[100px] text-right">Acciones</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">
                  {p.contracts?.properties?.nombre ?? "—"}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {p.contracts?.tenants?.nombre ?? "—"}
                </TableCell>
                <TableCell className="tabular-nums">
                  {formatPaymentAmount(p.monto, p.moneda)}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {MESES_CORTO[p.periodo_mes]} {p.periodo_anio}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {new Date(p.fecha_pago).toLocaleDateString("es-MX")}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant="secondary">{methodLabel(p.metodo_pago)}</Badge>
                </TableCell>
                {hasActions && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(p)}
                        >
                          <IconEdit className="size-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(p)}
                        >
                          <IconTrash className="size-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Eliminar pago"
        description="¿Estás seguro de eliminar este pago? Esta acción no se puede deshacer."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  );
}
