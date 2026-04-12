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
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import type { Tenant } from "@/types";

interface TenantTableProps {
  tenants: Tenant[];
  loading: boolean;
  onEdit?: (tenant: Tenant) => void;
  onDelete?: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export function TenantTable({
  tenants,
  loading,
  onEdit,
  onDelete,
}: TenantTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<Tenant | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteTarget || !onDelete) return;
    setDeleting(true);
    await onDelete(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
  }

  const hasActions = !!onEdit || !!onDelete;

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (tenants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
        <p className="text-muted-foreground">No hay inquilinos registrados.</p>
        <p className="text-sm text-muted-foreground">
          Registra tu primer inquilino para comenzar.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead className="hidden sm:table-cell">Email</TableHead>
              <TableHead className="hidden sm:table-cell">Fecha</TableHead>
              {hasActions && (
                <TableHead className="w-[100px] text-right">Acciones</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.nombre}</TableCell>
                <TableCell>{t.telefono}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  {t.email ?? "—"}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {new Date(t.created_at).toLocaleDateString("es-MX")}
                </TableCell>
                {hasActions && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(t)}
                        >
                          <IconEdit className="size-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(t)}
                        >
                          <IconTrash className="size-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Eliminar inquilino"
        description={`¿Estás seguro de eliminar a "${deleteTarget?.nombre}"? Esta acción no se puede deshacer y eliminará los contratos asociados.`}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  );
}
