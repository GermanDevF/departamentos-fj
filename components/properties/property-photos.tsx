"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { IconLoader2, IconPlus, IconTrash } from "@tabler/icons-react";
import { toast } from "sonner";
import {
  uploadPropertyPhoto,
  deletePropertyPhoto,
} from "@/lib/properties/photo-actions";
import { Button } from "@/components/ui/button";
import type { PropertyPhoto } from "@/types";

interface PropertyPhotosProps {
  propertyId: string;
  photos: PropertyPhoto[];
  onPhotosChange: (photos: PropertyPhoto[]) => void;
}

export function PropertyPhotos({
  propertyId,
  photos,
  onPhotosChange,
}: PropertyPhotosProps) {
  const [uploading, setUploading] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files?.length) return;

      setUploading(true);
      let currentPhotos = [...photos];

      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          toast.error(`"${file.name}" no es una imagen.`);
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`"${file.name}" supera 5 MB.`);
          continue;
        }

        const fd = new FormData();
        fd.set("file", file);
        const result = await uploadPropertyPhoto(propertyId, fd);

        if (result.success && result.data) {
          currentPhotos = [...currentPhotos, result.data];
          onPhotosChange(currentPhotos);
        } else {
          toast.error(result.error ?? "Error al subir imagen.");
        }
      }

      setUploading(false);
      e.target.value = "";
    },
    [propertyId, photos, onPhotosChange],
  );

  const handleDelete = useCallback(
    async (storageKey: string) => {
      setDeletingKey(storageKey);
      const result = await deletePropertyPhoto(propertyId, storageKey);

      if (result.success) {
        onPhotosChange(photos.filter((p) => p.storage_key !== storageKey));
        toast.success("Foto eliminada.");
      } else {
        toast.error(result.error ?? "Error al eliminar.");
      }
      setDeletingKey(null);
    },
    [propertyId, photos, onPhotosChange],
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium leading-none">Fotos</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          className="relative"
          asChild
        >
          <label className="cursor-pointer">
            {uploading ? (
              <IconLoader2 className="size-4 animate-spin" />
            ) : (
              <IconPlus className="size-4" />
            )}
            {uploading ? "Subiendo..." : "Agregar"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </Button>
      </div>

      {photos.length === 0 && !uploading && (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No hay fotos. Agrega fotos de la propiedad.
        </p>
      )}

      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {photos.map((photo) => {
            const isDeleting = deletingKey === photo.storage_key;
            return (
              <div
                key={photo.storage_key}
                className="group relative overflow-hidden rounded-lg border"
              >
                <div className="relative aspect-video w-full">
                  <Image
                    src={photo.url}
                    alt="Foto de propiedad"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 200px"
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/40">
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="size-8 opacity-0 transition-opacity group-hover:opacity-100"
                    disabled={isDeleting}
                    onClick={() => void handleDelete(photo.storage_key)}
                  >
                    {isDeleting ? (
                      <IconLoader2 className="size-4 animate-spin" />
                    ) : (
                      <IconTrash className="size-4" />
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
