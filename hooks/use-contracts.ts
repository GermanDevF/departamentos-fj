"use client";

import { useState, useCallback, useEffect } from "react";
import {
  getContracts,
  createContract,
  updateContract,
  deactivateContract,
  deleteContract,
  type ContractRow,
} from "@/lib/contracts/actions";
import type { CreateContractInput, UpdateContractInput } from "@/types";

export function useContracts() {
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const result = await getContracts();
    if (result.success && result.data) {
      setContracts(result.data);
    }
    setLoading(false);
  }, []);

  const create = useCallback(
    async (input: CreateContractInput) => {
      const result = await createContract(input);
      if (result.success) await refresh();
      return result;
    },
    [refresh],
  );

  const update = useCallback(
    async (id: string, input: UpdateContractInput) => {
      const result = await updateContract(id, input);
      if (result.success) await refresh();
      return result;
    },
    [refresh],
  );

  const deactivate = useCallback(
    async (id: string) => {
      const result = await deactivateContract(id);
      if (result.success) await refresh();
      return result;
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      const result = await deleteContract(id);
      if (result.success) await refresh();
      return result;
    },
    [refresh],
  );

  useEffect(() => {
    queueMicrotask(() => {
      void refresh();
    });
  }, [refresh]);

  return { contracts, loading, create, update, deactivate, remove, refresh };
}
