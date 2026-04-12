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
}

export function PaymentDialog({
  open,
  onOpenChange,
  payment,
  contracts,
  onSubmit,
}: PaymentDialogProps) {
  async function handleSubmit(data: CreatePaymentInput) {
    const result = await onSubmit(data);
    if (result.success) onOpenChange(false);
    return result;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg sm:p-6">
        <DialogHeader>
          <DialogTitle>
            {payment ? "Editar pago" : "Registrar pago"}
          </DialogTitle>
        </DialogHeader>
        <PaymentForm
          payment={payment}
          contracts={contracts}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
