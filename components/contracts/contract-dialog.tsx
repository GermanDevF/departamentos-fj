"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ContractForm } from "./contract-form";
import type { Property, Tenant, CreateContractInput } from "@/types";
import type { ContractRow } from "@/lib/contracts/actions";

interface ContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract?: ContractRow;
  properties: Property[];
  tenants: Tenant[];
  onSubmit: (data: CreateContractInput) => Promise<{ success: boolean; error?: string }>;
}

export function ContractDialog({
  open,
  onOpenChange,
  contract,
  properties,
  tenants,
  onSubmit,
}: ContractDialogProps) {
  async function handleSubmit(data: CreateContractInput) {
    const result = await onSubmit(data);
    if (result.success) onOpenChange(false);
    return result;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg sm:p-6">
        <DialogHeader>
          <DialogTitle>
            {contract ? "Editar contrato" : "Nuevo contrato"}
          </DialogTitle>
        </DialogHeader>
        <ContractForm
          contract={contract}
          properties={properties}
          tenants={tenants}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
