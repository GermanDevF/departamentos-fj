"use client";

import { useState, useCallback, useEffect } from "react";
import {
  getTenants,
  createTenant,
  updateTenant,
  deleteTenant,
} from "@/lib/tenants/actions";
import type { Tenant, CreateTenantInput, UpdateTenantInput } from "@/types";

export function useTenants() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const result = await getTenants();
    if (result.success && result.data) {
      setTenants(result.data);
    }
    setLoading(false);
  }, []);

  const create = useCallback(
    async (input: CreateTenantInput) => {
      const result = await createTenant(input);
      if (result.success) await refresh();
      return result;
    },
    [refresh],
  );

  const update = useCallback(
    async (id: string, input: UpdateTenantInput) => {
      const result = await updateTenant(id, input);
      if (result.success) await refresh();
      return result;
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      const result = await deleteTenant(id);
      if (result.success) await refresh();
      return result;
    },
    [refresh],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { tenants, loading, create, update, remove, refresh };
}
