"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useTenants } from "@/hooks/use-tenants";
import { TenantTable } from "@/components/tenants/tenant-table";
import { TenantDialog } from "@/components/tenants/tenant-dialog";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";
import { toast } from "sonner";
import type { Tenant, CreateTenantInput } from "@/types";

export default function InquilinosPage() {
  const { isAdmin } = useAuth();
  const { tenants, loading, create, update, remove } = useTenants();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Tenant | undefined>();

  function handleCreate() {
    setEditing(undefined);
    setDialogOpen(true);
  }

  function handleEdit(tenant: Tenant) {
    setEditing(tenant);
    setDialogOpen(true);
  }

  async function handleSubmit(data: CreateTenantInput) {
    const result = editing
      ? await update(editing.id, data)
      : await create(data);

    if (result.success) {
      toast.success(editing ? "Inquilino actualizado" : "Inquilino registrado");
    } else {
      toast.error(result.error ?? "Error al guardar");
    }
    return result;
  }

  async function handleDelete(id: string) {
    const result = await remove(id);
    if (result.success) {
      toast.success("Inquilino eliminado");
    } else {
      toast.error(result.error ?? "Error al eliminar");
    }
    return result;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">Inquilinos</h1>
          <p className="text-sm text-muted-foreground">
            Administra tus inquilinos registrados
          </p>
        </div>
        {isAdmin && (
          <Button className="w-full shrink-0 sm:w-auto" onClick={handleCreate}>
            <IconPlus className="size-4" />
            Nuevo inquilino
          </Button>
        )}
      </div>

      <TenantTable
        tenants={tenants}
        loading={loading}
        onEdit={isAdmin ? handleEdit : undefined}
        onDelete={isAdmin ? handleDelete : undefined}
      />

      {isAdmin && (
        <TenantDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          tenant={editing}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
