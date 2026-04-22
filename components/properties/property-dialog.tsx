"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PropertyForm } from "./property-form";
import type { Property, CreatePropertyInput, Direccion } from "@/types";

interface PropertyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property?: Property;
  direcciones?: Direccion[];
  onSubmit: (data: CreatePropertyInput) => Promise<{ success: boolean; error?: string }>;
}

export function PropertyDialog({
  open,
  onOpenChange,
  property,
  direcciones,
  onSubmit,
}: PropertyDialogProps) {
  async function handleSubmit(data: CreatePropertyInput) {
    const result = await onSubmit(data);
    if (result.success) onOpenChange(false);
    return result;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg sm:p-6">
        <DialogHeader>
          <DialogTitle>
            {property ? "Editar propiedad" : "Nueva propiedad"}
          </DialogTitle>
        </DialogHeader>
        <PropertyForm
          property={property}
          direcciones={direcciones}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
