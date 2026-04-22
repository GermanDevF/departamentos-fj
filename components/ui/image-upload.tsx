"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { IconLoader2, IconPhoto, IconTrash, IconUpload } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ImageUploadProps {
  value?: string | null;
  onUpload: (file: File) => Promise<void>;
  onRemove?: () => Promise<void>;
  disabled?: boolean;
  accept?: string;
  label?: string;
  aspectRatio?: string;
  className?: string;
}

export function ImageUpload({
  value,
  onUpload,
  onRemove,
  disabled = false,
  accept = "image/jpeg,image/png,image/webp,image/gif",
  label,
  aspectRatio = "aspect-video",
  className,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const busy = uploading || removing || disabled;

  const handleFile = useCallback(
    async (file: File) => {
      if (busy) return;
      setUploading(true);
      try {
        await onUpload(file);
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [busy, onUpload],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void handleFile(file);
    },
    [handleFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith("image/")) void handleFile(file);
    },
    [handleFile],
  );

  const handleRemove = useCallback(async () => {
    if (!onRemove || busy) return;
    setRemoving(true);
    try {
      await onRemove();
    } finally {
      setRemoving(false);
    }
  }, [onRemove, busy]);

  if (value) {
    return (
      <div className={cn("group relative overflow-hidden rounded-lg border", className)}>
        {label && (
          <span className="absolute top-2 left-2 z-10 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
            {label}
          </span>
        )}
        <div className={cn("relative w-full", aspectRatio)}>
          <Image
            src={value}
            alt={label ?? "Imagen"}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 400px"
          />
        </div>
        {onRemove && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/40">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="opacity-0 transition-opacity group-hover:opacity-100"
              disabled={busy}
              onClick={handleRemove}
            >
              {removing ? (
                <IconLoader2 className="size-4 animate-spin" />
              ) : (
                <IconTrash className="size-4" />
              )}
              Eliminar
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-muted-foreground transition-colors",
        dragOver && "border-primary bg-primary/5",
        busy && "pointer-events-none opacity-50",
        !busy && "hover:border-primary/50 hover:bg-muted/50",
        className,
      )}
      onClick={() => !busy && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (!busy) inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!busy) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
        disabled={busy}
      />
      {uploading ? (
        <IconLoader2 className="size-8 animate-spin text-primary" />
      ) : (
        <>
          <div className="flex items-center gap-2 text-muted-foreground">
            <IconPhoto className="size-6" />
            <IconUpload className="size-4" />
          </div>
          {label && <p className="text-sm font-medium">{label}</p>}
          <p className="text-xs">Haz clic o arrastra una imagen</p>
        </>
      )}
    </div>
  );
}
