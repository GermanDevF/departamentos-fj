"use client";

import { useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IconDownload } from "@tabler/icons-react";

interface PdfViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blobUrl: string | null;
  filename: string;
}

export function PdfViewerDialog({
  open,
  onOpenChange,
  blobUrl,
  filename,
}: PdfViewerDialogProps) {
  const handleClose = useCallback(
    (value: boolean) => {
      if (!value && blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
      onOpenChange(value);
    },
    [blobUrl, onOpenChange],
  );

  function handleDownload() {
    if (!blobUrl) return;
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex h-[85vh] max-h-[85vh] flex-col sm:max-w-4xl">
        <DialogHeader className="flex flex-row items-center justify-between gap-2">
          <DialogTitle>Vista previa</DialogTitle>
          <Button
            variant="outline"
            size="sm"
            className="mr-8"
            onClick={handleDownload}
            disabled={!blobUrl}
          >
            <IconDownload className="size-4" />
            Descargar
          </Button>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-hidden rounded-md border">
          {blobUrl ? (
            <iframe
              src={blobUrl}
              className="h-full w-full"
              title="Vista previa del PDF"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No hay documento para mostrar.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
