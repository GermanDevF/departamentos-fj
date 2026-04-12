"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconTrash, IconCheck, IconX } from "@tabler/icons-react";
import type { AppUser } from "@/lib/users/actions";
import type { UserRole } from "@/lib/auth/types";

interface UserTableProps {
  users: AppUser[];
  loading: boolean;
  currentUserId: string;
  onToggleActive: (profileId: string, isActive: boolean) => Promise<{ success: boolean; error?: string }>;
  onRoleChange: (
    profileId: string,
    role: UserRole,
  ) => Promise<{ success: boolean; error?: string }>;
  onDelete: (profileId: string) => Promise<{ success: boolean; error?: string }>;
}

export function UserTable({
  users,
  loading,
  currentUserId,
  onToggleActive,
  onRoleChange,
  onDelete,
}: UserTableProps) {
  const [ deleteTarget, setDeleteTarget ] = useState<AppUser | null>(null);
  const [ deleting, setDeleting ] = useState(false);
  const [ togglingId, setTogglingId ] = useState<string | null>(null);
  const [ roleChangingId, setRoleChangingId ] = useState<string | null>(null);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    await onDelete(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
  }

  async function handleToggleActive(user: AppUser) {
    setTogglingId(user.id);
    await onToggleActive(user.id, !user.is_active);
    setTogglingId(null);
  }

  async function handleRoleChange(user: AppUser, newRole: UserRole) {
    if (newRole === user.role) return;
    setRoleChangingId(user.id);
    await onRoleChange(user.id, newRole);
    setRoleChangingId(null);
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
        <p className="text-muted-foreground">No hay usuarios registrados.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="hidden sm:table-cell">Fecha</TableHead>
              <TableHead className="w-[120px] text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => {
              const isSelf = u.user_id === currentUserId;
              return (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    {u.email || u.user_id.slice(0, 8) + "..."}
                    {isSelf && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Tú
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {isSelf ? (
                      <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                        {u.role === "admin" ? "Administrador" : "Staff"}
                      </Badge>
                    ) : (
                      <Select
                        value={u.role}
                        onValueChange={(v) =>
                          void handleRoleChange(u, v as UserRole)
                        }
                        disabled={roleChangingId === u.id}
                      >
                        <SelectTrigger className="h-8 w-[180px]" size="sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="staff">Staff (solo lectura)</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  <TableCell>
                    {u.is_active ? (
                      <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400">
                        Activo
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-400">
                        Pendiente
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {new Date(u.created_at).toLocaleDateString("es-MX")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={isSelf || togglingId === u.id}
                        onClick={() => handleToggleActive(u)}
                        title={u.is_active ? "Desactivar usuario" : "Aprobar usuario"}
                      >
                        {u.is_active ? (
                          <IconX className="size-4" />
                        ) : (
                          <IconCheck className="size-4 text-emerald-600" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={isSelf}
                        onClick={() => setDeleteTarget(u)}
                        title={isSelf ? "No puedes eliminarte a ti mismo" : "Eliminar usuario"}
                      >
                        <IconTrash className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Eliminar usuario"
        description={`¿Estás seguro de eliminar este usuario? Se eliminará su perfil de la aplicación.`}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  );
}
