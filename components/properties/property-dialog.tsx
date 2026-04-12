"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PropertyForm } from "./property-form";
import type { Property, CreatePropertyInput } from "@/types";

interface PropertyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property?: Property;
  onSubmit: (data: CreatePropertyInput) => Promise<{ success: boolean; error?: string }>;
}

export function PropertyDialog({
  open,
  onOpenChange,
  property,
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
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
