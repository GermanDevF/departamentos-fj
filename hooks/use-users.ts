"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useAdminPendingRealtime } from "@/components/admin-pending-realtime-provider";
import {
  getUsers,
  createUser,
  updateUserRole,
  toggleUserActive,
  deleteUser,
  type AppUser,
} from "@/lib/users/actions";
import type { UserRole } from "@/lib/auth/types";

interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export function useUsers() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { registerPendingRefresh } = useAdminPendingRealtime();

  const refresh = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    if (!silent) {
      setLoading(true);
      setLoadError(null);
    }
    try {
      const result = await getUsers();
      if (result.success) {
        const list = Array.isArray(result.data) ? result.data : [];
        setUsers(list);
      } else {
        setUsers([]);
        if (!silent) {
          setLoadError(result.error ?? "No se pudieron cargar los usuarios.");
        }
      }
    } catch {
      setUsers([]);
      if (!silent) {
        setLoadError("No se pudieron cargar los usuarios.");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  const create = useCallback(
    async (input: CreateUserInput) => {
      const result = await createUser(input);
      if (result.success) await refresh();
      return result;
    },
    [refresh],
  );

  const changeRole = useCallback(
    async (profileId: string, role: UserRole) => {
      const result = await updateUserRole(profileId, role);
      if (result.success) await refresh();
      return result;
    },
    [refresh],
  );

  const toggleActive = useCallback(
    async (profileId: string, isActive: boolean) => {
      const result = await toggleUserActive(profileId, isActive);
      if (result.success) await refresh();
      return result;
    },
    [refresh],
  );

  const remove = useCallback(
    async (profileId: string) => {
      const result = await deleteUser(profileId);
      if (result.success) await refresh();
      return result;
    },
    [refresh],
  );

  const pendingCount = useMemo(
    () => users.filter((u) => !u.is_active).length,
    [users],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    return registerPendingRefresh(() => {
      void refresh({ silent: true });
    });
  }, [registerPendingRefresh, refresh]);

  return {
    users,
    loading,
    loadError,
    pendingCount,
    create,
    changeRole,
    toggleActive,
    remove,
    refresh,
  };
}
