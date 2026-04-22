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
import type { Direccion } from "@/types";

interface DireccionTableProps {
  direcciones: Direccion[];
  loading: boolean;
  onEdit?: (direccion: Direccion) => void;
  onDelete?: (id: string) => Promise<{ success: boolean; error?: string }>;
}

function formatDireccionCalle(d: Direccion): string {
  return `${d.calle} ${d.numero_exterior}${d.numero_interior ? ` Int. ${d.numero_interior}` : ""}`;
}

export function DireccionTable({
  direcciones,
  loading,
  onEdit,
  onDelete,
}: DireccionTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<Direccion | null>(null);
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

  if (direcciones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
        <p className="text-muted-foreground">No hay direcciones registradas.</p>
        <p className="text-sm text-muted-foreground">
          Crea tu primera dirección para agrupar propiedades.
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
              <TableHead>Calle y número</TableHead>
              <TableHead className="hidden md:table-cell">Colonia</TableHead>
              <TableHead className="hidden lg:table-cell">Ciudad / Estado</TableHead>
              <TableHead className="hidden sm:table-cell">Fecha</TableHead>
              {hasActions && (
                <TableHead className="w-[100px] text-right">Acciones</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {direcciones.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.nombre}</TableCell>
                <TableCell>{formatDireccionCalle(d)}</TableCell>
                <TableCell className="hidden md:table-cell">{d.colonia}</TableCell>
                <TableCell className="hidden lg:table-cell">
                  {d.ciudad}, {d.estado}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {new Date(d.created_at).toLocaleDateString("es-MX")}
                </TableCell>
                {hasActions && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(d)}
                        >
                          <IconEdit className="size-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(d)}
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
        title="Eliminar dirección"
        description={`¿Estás seguro de eliminar "${deleteTarget?.nombre}"? Las propiedades asociadas no se eliminarán, pero perderán la referencia a esta dirección.`}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  );
}
