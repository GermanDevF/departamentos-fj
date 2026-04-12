"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useProperties } from "@/hooks/use-properties";
import { PropertyTable } from "@/components/properties/property-table";
import { PropertyDialog } from "@/components/properties/property-dialog";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";
import { toast } from "sonner";
import type { Property, CreatePropertyInput } from "@/types";

export default function PropiedadesPage() {
  const { isAdmin } = useAuth();
  const { properties, loading, create, update, remove } = useProperties();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Property | undefined>();

  function handleCreate() {
    setEditing(undefined);
    setDialogOpen(true);
  }

  function handleEdit(property: Property) {
    setEditing(property);
    setDialogOpen(true);
  }

  async function handleSubmit(data: CreatePropertyInput) {
    const result = editing
      ? await update(editing.id, data)
      : await create(data);

    if (result.success) {
      toast.success(editing ? "Propiedad actualizada" : "Propiedad creada");
    } else {
      toast.error(result.error ?? "Error al guardar");
    }
    return result;
  }

  async function handleDelete(id: string) {
    const result = await remove(id);
    if (result.success) {
      toast.success("Propiedad eliminada");
    } else {
      toast.error(result.error ?? "Error al eliminar");
    }
    return result;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">Propiedades</h1>
          <p className="text-sm text-muted-foreground">
            Administra tus casas y departamentos
          </p>
        </div>
        {isAdmin && (
          <Button className="w-full shrink-0 sm:w-auto" onClick={handleCreate}>
            <IconPlus className="size-4" />
            Nueva propiedad
          </Button>
        )}
      </div>

      <PropertyTable
        properties={properties}
        loading={loading}
        onEdit={isAdmin ? handleEdit : undefined}
        onDelete={isAdmin ? handleDelete : undefined}
      />

      {isAdmin && (
        <PropertyDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          property={editing}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
