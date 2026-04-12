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
import { IconEdit, IconTrash } from "@tabler/icons-react";
import type { Property } from "@/types";

interface PropertyTableProps {
  properties: Property[];
  loading: boolean;
  onEdit?: (property: Property) => void;
  onDelete?: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export function PropertyTable({
  properties,
  loading,
  onEdit,
  onDelete,
}: PropertyTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);
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

  if (properties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
        <p className="text-muted-foreground">No hay propiedades registradas.</p>
        <p className="text-sm text-muted-foreground">
          Crea tu primera propiedad para comenzar.
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
              <TableHead>Dirección</TableHead>
              <TableHead className="hidden md:table-cell">Descripción</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="hidden sm:table-cell">Fecha</TableHead>
              {hasActions && (
                <TableHead className="w-[100px] text-right">Acciones</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {properties.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.nombre}</TableCell>
                <TableCell>{p.direccion}</TableCell>
                <TableCell className="hidden max-w-[200px] truncate md:table-cell">
                  {p.descripcion ?? "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={p.disponible ? "default" : "secondary"}>
                    {p.disponible ? "Disponible" : "No disponible"}
                  </Badge>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {new Date(p.created_at).toLocaleDateString("es-MX")}
                </TableCell>
                {hasActions && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(p)}
                        >
                          <IconEdit className="size-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(p)}
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
        title="Eliminar propiedad"
        description={`¿Estás seguro de eliminar "${deleteTarget?.nombre}"? Esta acción no se puede deshacer y eliminará los contratos asociados.`}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  );
}
