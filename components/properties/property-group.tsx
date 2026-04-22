"use client";

import { useState } from "react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { PropertyTable } from "./property-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  IconChevronRight,
  IconMapPin,
  IconMapPinOff,
  IconEdit,
  IconTrash,
} from "@tabler/icons-react";
import type { Property, Direccion } from "@/types";

interface PropertyGroupProps {
  direccion?: Direccion;
  properties: Property[];
  loading: boolean;
  isAdmin: boolean;
  onEditProperty?: (p: Property) => void;
  onDeleteProperty?: (id: string) => Promise<{ success: boolean; error?: string }>;
  onEditDireccion?: (d: Direccion) => void;
  onDeleteDireccion?: (id: string) => Promise<{ success: boolean; error?: string }>;
}

function formatDireccionSubtitle(d: Direccion): string {
  let text = `${d.calle} ${d.numero_exterior}`;
  if (d.numero_interior) text += ` Int. ${d.numero_interior}`;
  text += `, ${d.colonia}, ${d.ciudad}`;
  return text;
}

export function PropertyGroup({
  direccion,
  properties,
  loading,
  isAdmin,
  onEditProperty,
  onDeleteProperty,
  onEditDireccion,
  onDeleteDireccion,
}: PropertyGroupProps) {
  const [ open, setOpen ] = useState(true);
  const [ deleteConfirmOpen, setDeleteConfirmOpen ] = useState(false);
  const [ deleting, setDeleting ] = useState(false);

  async function handleDeleteDireccion() {
    if (!direccion || !onDeleteDireccion) return;
    setDeleting(true);
    await onDeleteDireccion(direccion.id);
    setDeleting(false);
    setDeleteConfirmOpen(false);
  }

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="rounded-lg border">
          <CollapsibleTrigger asChild>
            <div
              role="button"
              tabIndex={0}
              className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
            >
              <IconChevronRight
                className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 data-[state=open]:rotate-90"
                data-state={open ? "open" : "closed"}
              />
              {direccion ? (
                <IconMapPin className="size-4 shrink-0 text-muted-foreground" />
              ) : (
                <IconMapPinOff className="size-4 shrink-0 text-muted-foreground" />
              )}
              <div className="min-w-0 flex-1">
                <span className="font-medium">
                  {direccion ? direccion.nombre : "Sin asignar"}
                </span>
                {direccion && (
                  <span className="ml-2 text-sm text-muted-foreground hidden sm:inline">
                    {formatDireccionSubtitle(direccion)}
                  </span>
                )}
              </div>
              <Badge variant="secondary" className="shrink-0 tabular-nums">
                {properties.length}
              </Badge>
              {isAdmin && direccion && (
                <div
                  className="flex shrink-0 gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  {onEditDireccion && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => onEditDireccion(direccion)}
                    >
                      <IconEdit className="size-3.5" />
                    </Button>
                  )}
                  {onDeleteDireccion && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => setDeleteConfirmOpen(true)}
                    >
                      <IconTrash className="size-3.5" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="border-t px-4 py-3">
              {!loading && properties.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No hay propiedades en esta dirección.
                </p>
              ) : (
                <PropertyTable
                  properties={properties}
                  loading={loading}
                  compact
                  onEdit={isAdmin ? onEditProperty : undefined}
                  onDelete={isAdmin ? onDeleteProperty : undefined}
                />
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {direccion && (
        <ConfirmDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          title="Eliminar dirección"
          description={`¿Estás seguro de eliminar "${direccion.nombre}"? Las propiedades asociadas no se eliminarán, pero perderán la referencia a esta dirección.`}
          onConfirm={handleDeleteDireccion}
          loading={deleting}
        />
      )}
    </>
  );
}
