"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { usePayments } from "@/hooks/use-payments";
import { useContracts } from "@/hooks/use-contracts";
import { PaymentTable } from "@/components/payments/payment-table";
import { PaymentDialog } from "@/components/payments/payment-dialog";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";
import { toast } from "sonner";
import type { CreatePaymentInput } from "@/types";
import type { PaymentRow } from "@/lib/payments/actions";

export default function PagosPage() {
  const { isAdmin } = useAuth();
  const { payments, loading, create, update, remove } = usePayments();
  const { contracts } = useContracts();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentRow | undefined>();

  function handleCreate() {
    setEditing(undefined);
    setDialogOpen(true);
  }

  function handleEdit(payment: PaymentRow) {
    setEditing(payment);
    setDialogOpen(true);
  }

  async function handleSubmit(data: CreatePaymentInput) {
    const result = editing
      ? await update(editing.id, data)
      : await create(data);

    if (result.success) {
      toast.success(editing ? "Pago actualizado" : "Pago registrado");
    } else {
      toast.error(result.error ?? "Error al guardar");
    }
    return result;
  }

  async function handleDelete(id: string) {
    const result = await remove(id);
    if (result.success) {
      toast.success("Pago eliminado");
    } else {
      toast.error(result.error ?? "Error al eliminar");
    }
    return result;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">Pagos</h1>
          <p className="text-sm text-muted-foreground">
            Registra y consulta los pagos de renta
          </p>
        </div>
        {isAdmin && (
          <Button className="w-full shrink-0 sm:w-auto" onClick={handleCreate}>
            <IconPlus className="size-4" />
            Registrar pago
          </Button>
        )}
      </div>

      <PaymentTable
        payments={payments}
        loading={loading}
        onEdit={isAdmin ? handleEdit : undefined}
        onDelete={isAdmin ? handleDelete : undefined}
      />

      {isAdmin && (
        <PaymentDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          payment={editing}
          contracts={contracts}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
