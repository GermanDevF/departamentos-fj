"use client";

import { useState, useCallback, useEffect } from "react";
import {
  getPayments,
  createPayment,
  updatePayment,
  deletePayment,
  type PaymentRow,
} from "@/lib/payments/actions";
import type { CreatePaymentInput, UpdatePaymentInput } from "@/types";

export function usePayments() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const result = await getPayments();
    if (result.success && result.data) {
      setPayments(result.data);
    }
    setLoading(false);
  }, []);

  const create = useCallback(
    async (input: CreatePaymentInput) => {
      const result = await createPayment(input);
      if (result.success) await refresh();
      return result;
    },
    [refresh],
  );

  const update = useCallback(
    async (id: string, input: UpdatePaymentInput) => {
      const result = await updatePayment(id, input);
      if (result.success) await refresh();
      return result;
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      const result = await deletePayment(id);
      if (result.success) await refresh();
      return result;
    },
    [refresh],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { payments, loading, create, update, remove, refresh };
}
