"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DireccionForm } from "./direccion-form";
import type { Direccion, CreateDireccionInput } from "@/types";

interface DireccionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  direccion?: Direccion;
  onSubmit: (data: CreateDireccionInput) => Promise<{ success: boolean; error?: string }>;
}

export function DireccionDialog({
  open,
  onOpenChange,
  direccion,
  onSubmit,
}: DireccionDialogProps) {
  async function handleSubmit(data: CreateDireccionInput) {
    const result = await onSubmit(data);
    if (result.success) onOpenChange(false);
    return result;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl sm:p-6">
        <DialogHeader>
          <DialogTitle>
            {direccion ? "Editar dirección" : "Nueva dirección"}
          </DialogTitle>
        </DialogHeader>
        <DireccionForm
          direccion={direccion}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
