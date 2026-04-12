"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TenantForm } from "./tenant-form";
import type { Tenant, CreateTenantInput } from "@/types";

interface TenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant?: Tenant;
  onSubmit: (data: CreateTenantInput) => Promise<{ success: boolean; error?: string }>;
}

export function TenantDialog({
  open,
  onOpenChange,
  tenant,
  onSubmit,
}: TenantDialogProps) {
  async function handleSubmit(data: CreateTenantInput) {
    const result = await onSubmit(data);
    if (result.success) onOpenChange(false);
    return result;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg sm:p-6">
        <DialogHeader>
          <DialogTitle>
            {tenant ? "Editar inquilino" : "Nuevo inquilino"}
          </DialogTitle>
        </DialogHeader>
        <TenantForm
          tenant={tenant}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
