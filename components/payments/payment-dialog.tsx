"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PaymentForm } from "./payment-form";
import type { CreatePaymentInput } from "@/types";
import type { ContractRow } from "@/lib/contracts/actions";
import type { PaymentRow } from "@/lib/payments/actions";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment?: PaymentRow;
  contracts: ContractRow[];
  onSubmit: (data: CreatePaymentInput) => Promise<{ success: boolean; error?: string }>;
  prefilledValues?: {
    contrato_id?: string;
    periodo_mes?: number;
    periodo_anio?: number;
    monto?: number;
  };
  lockedFields?: { contrato?: boolean; period?: boolean };
  remainingBalance?: number;
  submitLabel?: string;
}

export function PaymentDialog({
  open,
  onOpenChange,
  payment,
  contracts,
  onSubmit,
  prefilledValues,
  lockedFields,
  remainingBalance,
  submitLabel,
}: PaymentDialogProps) {
  async function handleSubmit(data: CreatePaymentInput) {
    const result = await onSubmit(data);
    if (result.success) onOpenChange(false);
    return result;
  }

  const title = payment
    ? "Editar pago"
    : prefilledValues?.contrato_id
      ? "Registrar abono"
      : "Registrar pago";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg sm:p-6">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <PaymentForm
          payment={payment}
          contracts={contracts}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          prefilledValues={prefilledValues}
          lockedFields={lockedFields}
          remainingBalance={remainingBalance}
          submitLabel={submitLabel}
        />
      </DialogContent>
    </Dialog>
  );
}
