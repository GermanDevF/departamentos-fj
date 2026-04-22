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
import { IconEdit, IconTrash, IconPlayerStop, IconHistory } from "@tabler/icons-react";
import { formatPaymentAmount } from "@/lib/payments/format-currency";
import type { ContractRow } from "@/lib/contracts/actions";

interface ContractTableProps {
  contracts: ContractRow[];
  loading: boolean;
  onEdit?: (contract: ContractRow) => void;
  onDeactivate?: (id: string) => Promise<{ success: boolean; error?: string }>;
  onDelete?: (id: string) => Promise<{ success: boolean; error?: string }>;
  onViewHistory?: (contract: ContractRow) => void;
}

export function ContractTable({
  contracts,
  loading,
  onEdit,
  onDeactivate,
  onDelete,
  onViewHistory,
}: ContractTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<ContractRow | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<ContractRow | null>(null);
  const [processing, setProcessing] = useState(false);

  async function handleDelete() {
    if (!deleteTarget || !onDelete) return;
    setProcessing(true);
    await onDelete(deleteTarget.id);
    setProcessing(false);
    setDeleteTarget(null);
  }

  async function handleDeactivate() {
    if (!deactivateTarget || !onDeactivate) return;
    setProcessing(true);
    await onDeactivate(deactivateTarget.id);
    setProcessing(false);
    setDeactivateTarget(null);
  }

  const hasActions = !!onEdit || !!onDeactivate || !!onDelete || !!onViewHistory;

  function formatCurrency(amount: number, moneda?: string) {
    return formatPaymentAmount(amount, moneda ?? "MXN");
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

  if (contracts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
        <p className="text-muted-foreground">No hay contratos registrados.</p>
        <p className="text-sm text-muted-foreground">
          Crea tu primer contrato para comenzar.
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
              <TableHead>Inquilino</TableHead>
              <TableHead className="hidden md:table-cell">Inicio</TableHead>
              <TableHead className="hidden lg:table-cell">Duración</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead className="hidden sm:table-cell">Día pago</TableHead>
              <TableHead>Estado</TableHead>
              {hasActions && (
                <TableHead className="w-[120px] text-right">Acciones</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">
                  {c.properties?.nombre ?? "—"}
                </TableCell>
                <TableCell>{c.tenants?.nombre ?? "—"}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {new Date(c.fecha_inicio).toLocaleDateString("es-MX")}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {c.tipo_duracion === "indefinido"
                    ? "Indefinido"
                    : `${c.duracion_cantidad} ${c.tipo_duracion}`}
                </TableCell>
                <TableCell>{formatCurrency(c.precio_mensual, c.moneda)}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  Día {c.dia_pago}
                </TableCell>
                <TableCell>
                  <Badge variant={c.activo ? "default" : "secondary"}>
                    {c.activo ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                {hasActions && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {onViewHistory && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onViewHistory(c)}
                          title="Ver historial de pagos"
                        >
                          <IconHistory className="size-4" />
                        </Button>
                      )}
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(c)}
                        >
                          <IconEdit className="size-4" />
                        </Button>
                      )}
                      {onDeactivate && c.activo && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeactivateTarget(c)}
                          title="Desactivar contrato"
                        >
                          <IconPlayerStop className="size-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(c)}
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
        title="Eliminar contrato"
        description={`¿Estás seguro de eliminar este contrato? Esta acción no se puede deshacer.`}
        onConfirm={handleDelete}
        loading={processing}
      />

      <ConfirmDialog
        open={!!deactivateTarget}
        onOpenChange={(open) => !open && setDeactivateTarget(null)}
        title="Desactivar contrato"
        description={`¿Desactivar el contrato de "${deactivateTarget?.properties?.nombre}" con "${deactivateTarget?.tenants?.nombre}"? El contrato quedará como inactivo.`}
        onConfirm={handleDeactivate}
        loading={processing}
        destructive={false}
        confirmLabel="Desactivar"
      />
    </>
  );
}
