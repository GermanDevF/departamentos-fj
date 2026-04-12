"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IconUserCheck } from "@tabler/icons-react";
import type { AppUser } from "@/lib/users/actions";

interface PendingAccessListProps {
  users: AppUser[];
  loading: boolean;
  onApprove: (profileId: string) => Promise<{ success: boolean; error?: string }>;
}

export function PendingAccessList({
  users,
  loading,
  onApprove,
}: PendingAccessListProps) {
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleApprove(u: AppUser) {
    setBusyId(u.id);
    await onApprove(u.id);
    setBusyId(null);
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
        <p className="text-muted-foreground">
          No hay cuentas pendientes de activación.
        </p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Cuando alguien solicite acceso desde el inicio de sesión, aparecerá
          aquí para que puedas activar su cuenta.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {users.map((u) => (
        <li key={u.id}>
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-base font-semibold">
                  {u.name?.trim() || "Sin nombre"}
                </CardTitle>
                <CardDescription className="font-medium text-foreground">
                  {u.email || u.user_id}
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className="shrink-0 border-amber-500/50 bg-amber-500/10 text-amber-800 dark:text-amber-400"
              >
                Pendiente
              </Badge>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pt-0 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Solicitud registrada el{" "}
                {new Date(u.created_at).toLocaleString("es-MX", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
              <Button
                size="sm"
                className="shrink-0 gap-1.5"
                disabled={busyId === u.id}
                onClick={() => handleApprove(u)}
              >
                <IconUserCheck className="size-4" />
                Activar cuenta
              </Button>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
