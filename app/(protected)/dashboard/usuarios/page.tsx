"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useUsers } from "@/hooks/use-users";
import { UserTable } from "@/components/users/user-table";
import { UserDialog } from "@/components/users/user-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { IconPlus, IconShieldOff } from "@tabler/icons-react";
import { toast } from "sonner";
import type { CreateUserFormValues } from "@/lib/validations";
import type { UserRole } from "@/lib/auth/types";

export default function UsuariosPage() {
  const { user, loading: authLoading } = useAuth();
  const { users, loading, loadError, create, changeRole, toggleActive, remove } =
    useUsers();
  const [dialogOpen, setDialogOpen] = useState(false);

  if (authLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
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

  async function handleSubmit(data: CreateUserFormValues) {
    const result = await create(data);
    if (result.success) {
      toast.success("Usuario creado exitosamente");
    } else {
      toast.error(result.error ?? "Error al crear usuario");
    }
    return result;
  }

  async function handleRoleChange(profileId: string, role: UserRole) {
    const result = await changeRole(profileId, role);
    if (result.success) {
      toast.success(
        role === "admin"
          ? "Usuario promovido a administrador"
          : "Rol actualizado a staff",
      );
    } else {
      toast.error(result.error ?? "Error al actualizar el rol");
    }
    return result;
  }

  async function handleToggleActive(profileId: string, isActive: boolean) {
    const result = await toggleActive(profileId, isActive);
    if (result.success) {
      toast.success(isActive ? "Usuario aprobado" : "Usuario desactivado");
    } else {
      toast.error(result.error ?? "Error al cambiar estado");
    }
    return result;
  }

  async function handleDelete(profileId: string) {
    const result = await remove(profileId);
    if (result.success) {
      toast.success("Usuario eliminado");
    } else {
      toast.error(result.error ?? "Error al eliminar usuario");
    }
    return result;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            Administra los usuarios del sistema
          </p>
        </div>
        <Button className="w-full shrink-0 sm:w-auto" onClick={() => setDialogOpen(true)}>
          <IconPlus className="size-4" />
          Nuevo usuario
        </Button>
      </div>

      {loadError && (
        <Alert variant="destructive">
          <AlertTitle>Error al cargar usuarios</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      <UserTable
        users={users}
        loading={loading}
        currentUserId={user?.id ?? ""}
        onToggleActive={handleToggleActive}
        onRoleChange={handleRoleChange}
        onDelete={handleDelete}
      />

      <UserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
