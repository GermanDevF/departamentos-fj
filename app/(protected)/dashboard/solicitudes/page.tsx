"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { useAdminPendingRealtime } from "@/components/admin-pending-realtime-provider";
import { usePendingAccess } from "@/hooks/use-pending-access";
import { PendingAccessList } from "@/components/access-requests/pending-access-list";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { IconShieldOff } from "@tabler/icons-react";
import { toast } from "sonner";

export default function SolicitudesAccesoPage() {
  const { user, loading: authLoading } = useAuth();
  const { refreshPendingCount } = useAdminPendingRealtime();
  const { pendingUsers, loading, loadError, approve } = usePendingAccess();

  if (authLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (user && user.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <IconShieldOff className="size-12 text-muted-foreground" />
        <p className="text-lg font-medium text-muted-foreground">
          No tienes permisos para acceder a esta sección.
        </p>
      </div>
    );
  }

  async function handleApprove(profileId: string) {
    const result = await approve(profileId);
    if (result.success) {
      toast.success("Cuenta activada. El usuario ya puede iniciar sesión.");
      void refreshPendingCount();
    } else {
      toast.error(result.error ?? "No se pudo activar la cuenta.");
    }
    return result;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Solicitudes de acceso</h1>
        <p className="text-sm text-muted-foreground">
          Activa las cuentas de quienes se registraron y esperan aprobación.
        </p>
      </div>

      {loadError && (
        <Alert variant="destructive">
          <AlertTitle>Error al cargar</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      <PendingAccessList
        users={pendingUsers}
        loading={loading}
        onApprove={handleApprove}
      />
    </div>
  );
}
