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
import { PdfViewerDialog } from "@/components/ui/pdf-viewer-dialog";
import { IconEdit, IconTrash, IconFileDownload, IconLoader2 } from "@tabler/icons-react";
import { toast } from "sonner";
import { METODOS_PAGO } from "@/types";
import { formatPaymentAmount } from "@/lib/payments/format-currency";
import type { PaymentRow } from "@/lib/payments/actions";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

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
  const [ deleteTarget, setDeleteTarget ] = useState<PaymentRow | null>(null);
  const [ deleting, setDeleting ] = useState(false);
  const [ downloading, setDownloading ] = useState<string | null>(null);
  const [ viewerOpen, setViewerOpen ] = useState(false);
  const [ viewerBlobUrl, setViewerBlobUrl ] = useState<string | null>(null);
  const [ viewerFilename, setViewerFilename ] = useState("");

  async function handleDownload(payment: PaymentRow) {
    setDownloading(payment.id);
    try {
      const { generateReceiptBlob } = await import(
        "@/lib/payments/generate-receipt-pdf"
      );
      const { blob, filename } = await generateReceiptBlob(payment);
      const url = URL.createObjectURL(blob);
      setViewerBlobUrl(url);
      setViewerFilename(filename);
      setViewerOpen(true);
    } catch {
      toast.error("Error al generar el recibo.");
    } finally {
      setDownloading(null);
    }
  }

  function handleViewerClose(open: boolean) {
    if (!open && viewerBlobUrl) {
      URL.revokeObjectURL(viewerBlobUrl);
      setViewerBlobUrl(null);
    }
    setViewerOpen(open);
  }

  async function handleDelete() {
    if (!deleteTarget || !onDelete) return;
    setDeleting(true);
    await onDelete(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
  }

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
              <TableHead className="w-[120px] text-right">Acciones</TableHead>
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
                  {MESES_CORTO[ p.periodo_mes ]} {p.periodo_anio}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {new Date(p.fecha_pago).toLocaleDateString("es-MX")}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant="secondary">{methodLabel(p.metodo_pago)}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Ver recibo PDF"
                          disabled={downloading === p.id}
                          onClick={() => handleDownload(p)}
                        >
                          {downloading === p.id ? (
                            <IconLoader2 className="size-4 animate-spin" />
                          ) : (
                            <IconFileDownload className="size-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Ver recibo PDF
                      </TooltipContent>
                    </Tooltip>
                    {onEdit && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(p)}
                          >
                            <IconEdit className="size-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Editar pago
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {onDelete && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(p)}
                          >
                            <IconTrash className="size-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Eliminar pago
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </TableCell>
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

      <PdfViewerDialog
        open={viewerOpen}
        onOpenChange={handleViewerClose}
        blobUrl={viewerBlobUrl}
        filename={viewerFilename}
      />
    </>
  );
}
