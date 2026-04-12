"use client";

import { useState, useCallback, useEffect } from "react";
import { useAdminPendingRealtime } from "@/components/admin-pending-realtime-provider";
import {
  listPendingAccessUsers,
  approvePendingUser,
  type AppUser,
} from "@/lib/users/actions";

export function usePendingAccess() {
  const { registerPendingRefresh } = useAdminPendingRealtime();
  const [pendingUsers, setPendingUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    if (!silent) {
      setLoading(true);
      setLoadError(null);
    }
    try {
      const result = await listPendingAccessUsers();
      if (result.success && Array.isArray(result.data)) {
        setPendingUsers(result.data);
      } else {
        setPendingUsers([]);
        if (!silent) {
          setLoadError(result.error ?? "No se pudieron cargar las solicitudes.");
        }
      }
    } catch {
      setPendingUsers([]);
      if (!silent) {
        setLoadError("No se pudieron cargar las solicitudes.");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  const approve = useCallback(
    async (profileId: string) => {
      const result = await approvePendingUser(profileId);
      if (result.success) await refresh({ silent: true });
      return result;
    },
    [refresh],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    return registerPendingRefresh(() => {
      void refresh({ silent: true });
    });
  }, [registerPendingRefresh, refresh]);

  return { pendingUsers, loading, loadError, refresh, approve };
}
