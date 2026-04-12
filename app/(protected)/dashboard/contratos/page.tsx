"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { ContractDialog } from "@/components/contracts/contract-dialog";
import { ContractTable } from "@/components/contracts/contract-table";
import { Button } from "@/components/ui/button";
import { useContracts } from "@/hooks/use-contracts";
import { useProperties } from "@/hooks/use-properties";
import { useTenants } from "@/hooks/use-tenants";
import type { ContractRow } from "@/lib/contracts/actions";
import type { CreateContractInput } from "@/types";
import { IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ContratosPage() {
  const { isAdmin } = useAuth();
  const { contracts, loading, create, update, deactivate, remove } = useContracts();
  const { properties } = useProperties();
  const { tenants } = useTenants();
  const [ dialogOpen, setDialogOpen ] = useState(false);
  const [ editing, setEditing ] = useState<ContractRow | undefined>();

  function handleCreate() {
    setEditing(undefined);
    setDialogOpen(true);
  }

  function handleEdit(contract: ContractRow) {
    setEditing(contract);
    setDialogOpen(true);
  }

  async function handleSubmit(data: CreateContractInput) {
    const result = editing
      ? await update(editing.id, data)
      : await create(data);

    if (result.success) {
      toast.success(editing ? "Contrato actualizado" : "Contrato creado");
    } else {
      toast.error(result.error ?? "Error al guardar");
    }
    return result;
  }

  async function handleDeactivate(id: string) {
    const result = await deactivate(id);
    if (result.success) {
      toast.success("Contrato desactivado");
    } else {
      toast.error(result.error ?? "Error al desactivar");
    }
    return result;
  }

  async function handleDelete(id: string) {
    const result = await remove(id);
    if (result.success) {
      toast.success("Contrato eliminado");
    } else {
      toast.error(result.error ?? "Error al eliminar");
    }
    return result;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">Contratos</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona los contratos de renta
          </p>
        </div>
        {isAdmin && (
          <Button className="w-full shrink-0 sm:w-auto" onClick={handleCreate}>
            <IconPlus className="size-4" />
            Nuevo contrato
          </Button>
        )}
      </div>

      <ContractTable
        contracts={contracts}
        loading={loading}
        onEdit={isAdmin ? handleEdit : undefined}
        onDeactivate={isAdmin ? handleDeactivate : undefined}
        onDelete={isAdmin ? handleDelete : undefined}
      />

      {isAdmin && (
        <ContractDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          contract={editing}
          properties={properties}
          tenants={tenants}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
