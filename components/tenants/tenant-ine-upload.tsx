"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { uploadTenantIne, removeTenantIne } from "@/lib/tenants/ine-actions";
import { ImageUpload } from "@/components/ui/image-upload";

interface TenantIneUploadProps {
  tenantId: string;
  frontalUrl: string | null;
  traseraUrl: string | null;
  onUpdate: (side: "frontal" | "trasera", url: string | null) => void;
  disabled?: boolean;
}

export function TenantIneUpload({
  tenantId,
  frontalUrl,
  traseraUrl,
  onUpdate,
  disabled = false,
}: TenantIneUploadProps) {
  const handleUpload = useCallback(
    (side: "frontal" | "trasera") => async (file: File) => {
      const fd = new FormData();
      fd.set("file", file);
      const result = await uploadTenantIne(tenantId, side, fd);
      if (result.success && result.data) {
        onUpdate(side, result.data.url);
        toast.success(`INE ${side === "frontal" ? "frontal" : "reverso"} guardada.`);
      } else {
        toast.error(result.error ?? "Error al subir la imagen.");
      }
    },
    [tenantId, onUpdate],
  );

  const handleRemove = useCallback(
    (side: "frontal" | "trasera") => async () => {
      const result = await removeTenantIne(tenantId, side);
      if (result.success) {
        onUpdate(side, null);
        toast.success(`INE ${side === "frontal" ? "frontal" : "reverso"} eliminada.`);
      } else {
        toast.error(result.error ?? "Error al eliminar.");
      }
    },
    [tenantId, onUpdate],
  );

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium leading-none">
        INE / Identificación
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <ImageUpload
          value={frontalUrl}
          onUpload={handleUpload("frontal")}
          onRemove={handleRemove("frontal")}
          label="Frente"
          disabled={disabled}
          aspectRatio="aspect-[1.586/1]"
        />
        <ImageUpload
          value={traseraUrl}
          onUpload={handleUpload("trasera")}
          onRemove={handleRemove("trasera")}
          label="Reverso"
          disabled={disabled}
          aspectRatio="aspect-[1.586/1]"
        />
      </div>
    </div>
  );
}
