"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@insforge/sdk";
import { useAuth } from "@/components/auth/auth-provider";
import { getPendingRequestsCount } from "@/lib/access-requests/actions";
import { getInsforgeAccessTokenForAdminRealtime } from "@/lib/auth/realtime-token";
import {
  ADMIN_PENDING_REALTIME_CHANNEL,
  ADMIN_PENDING_REALTIME_EVENT,
} from "@/lib/realtime/admin-pending";
import { toast } from "sonner";

interface AdminPendingRealtimeContextValue {
  pendingCount: number;
  refreshPendingCount: () => Promise<void>;
  /** Registra un callback para refrescar datos (p. ej. lista de usuarios) al llegar un evento. */
  registerPendingRefresh: (callback: () => void) => () => void;
}

const defaultValue: AdminPendingRealtimeContextValue = {
  pendingCount: 0,
  refreshPendingCount: async () => {},
  registerPendingRefresh: () => () => {},
};

const AdminPendingRealtimeContext =
  createContext<AdminPendingRealtimeContextValue>(defaultValue);

export function AdminPendingRealtimeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { isAdmin, loading, user } = useAuth();
  const [fetchedPendingCount, setFetchedPendingCount] = useState(0);
  const listenersRef = useRef(new Set<() => void>());

  const pendingCount =
    !isAdmin || loading ? 0 : fetchedPendingCount;

  const registerPendingRefresh = useCallback((callback: () => void) => {
    listenersRef.current.add(callback);
    return () => {
      listenersRef.current.delete(callback);
    };
  }, []);

  const refreshPendingCount = useCallback(async () => {
    if (!isAdmin) {
      setFetchedPendingCount(0);
      return;
    }
    const n = await getPendingRequestsCount();
    setFetchedPendingCount(n);
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin || loading) {
      return;
    }

    let cancelled = false;
    const clientRef: {
      current: ReturnType<typeof createClient> | null;
    } = { current: null };

    const notifyListeners = () => {
      listenersRef.current.forEach((fn) => {
        try {
          fn();
        } catch {
          /* noop */
        }
      });
    };

    const handler = async () => {
      const next = await getPendingRequestsCount();
      if (cancelled) return;
      setFetchedPendingCount((prev) => {
        if (next > prev) {
          toast.info("Nueva solicitud de acceso", {
            description: "Hay usuarios pendientes de aprobación.",
          });
        }
        return next;
      });
      notifyListeners();
    };

    (async () => {
      const initial = await getPendingRequestsCount();
      if (cancelled) return;
      setFetchedPendingCount(initial);

      const token = await getInsforgeAccessTokenForAdminRealtime();
      if (!token || cancelled) return;

      const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
      const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;
      if (!baseUrl || !anonKey) return;

      const insforge = createClient({
        baseUrl,
        anonKey,
        edgeFunctionToken: token,
      });
      clientRef.current = insforge;

      try {
        await insforge.realtime.connect();
        const sub = await insforge.realtime.subscribe(
          ADMIN_PENDING_REALTIME_CHANNEL,
        );
        if (!sub.ok || cancelled) return;
        insforge.realtime.on(ADMIN_PENDING_REALTIME_EVENT, handler);
      } catch {
        /* Realtime no configurado o canal no registrado */
      }
    })();

    return () => {
      cancelled = true;
      const c = clientRef.current;
      if (c) {
        c.realtime.off(ADMIN_PENDING_REALTIME_EVENT, handler);
        c.realtime.unsubscribe(ADMIN_PENDING_REALTIME_CHANNEL);
        c.realtime.disconnect();
        clientRef.current = null;
      }
    };
  }, [isAdmin, loading, user?.id]);

  const value = useMemo(
    () => ({
      pendingCount,
      refreshPendingCount,
      registerPendingRefresh,
    }),
    [pendingCount, refreshPendingCount, registerPendingRefresh],
  );

  return (
    <AdminPendingRealtimeContext.Provider value={value}>
      {children}
    </AdminPendingRealtimeContext.Provider>
  );
}

export function useAdminPendingRealtime() {
  return useContext(AdminPendingRealtimeContext);
}
