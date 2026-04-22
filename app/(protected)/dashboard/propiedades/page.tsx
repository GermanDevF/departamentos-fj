"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useProperties } from "@/hooks/use-properties";
import { useDirecciones } from "@/hooks/use-direcciones";
import { PropertyGroup } from "@/components/properties/property-group";
import { PropertyDialog } from "@/components/properties/property-dialog";
import { DireccionDialog } from "@/components/direcciones/direccion-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { IconPlus, IconMapPin } from "@tabler/icons-react";
import { toast } from "sonner";
import type {
  Property,
  Direccion,
  CreatePropertyInput,
  CreateDireccionInput,
} from "@/types";

export default function PropiedadesPage() {
  const { isAdmin } = useAuth();
  const {
    properties,
    loading: loadingProps,
    create: createProperty,
    update: updateProperty,
    remove: removeProperty,
    refresh: refreshProperties,
  } = useProperties();
  const {
    direcciones,
    loading: loadingDirs,
    create: createDireccion,
    update: updateDireccion,
    remove: removeDireccion,
  } = useDirecciones();

  const [ propDialogOpen, setPropDialogOpen ] = useState(false);
  const [ editingProp, setEditingProp ] = useState<Property | undefined>();
  const [ dirDialogOpen, setDirDialogOpen ] = useState(false);
  const [ editingDir, setEditingDir ] = useState<Direccion | undefined>();

  const groups = useMemo(() => {
    const byDireccion = new Map<string, Property[]>();
    const unassigned: Property[] = [];

    for (const p of properties) {
      if (p.direccion_id) {
        const list = byDireccion.get(p.direccion_id) ?? [];
        list.push(p);
        byDireccion.set(p.direccion_id, list);
      } else {
        unassigned.push(p);
      }
    }

    const ordered = direcciones.map((d) => ({
      direccion: d,
      properties: byDireccion.get(d.id) ?? [],
    }));

    return { ordered, unassigned };
  }, [ properties, direcciones ]);

  // --- Property handlers ---
  function handleCreateProperty() {
    setEditingProp(undefined);
    setPropDialogOpen(true);
  }
  function handleEditProperty(property: Property) {
    setEditingProp(property);
    setPropDialogOpen(true);
  }
  async function handleSubmitProperty(data: CreatePropertyInput) {
    const result = editingProp
      ? await updateProperty(editingProp.id, data)
      : await createProperty(data);
    if (result.success) {
      toast.success(editingProp ? "Propiedad actualizada" : "Propiedad creada");
    } else {
      toast.error(result.error ?? "Error al guardar");
    }
    return result;
  }
  async function handleDeleteProperty(id: string) {
    const result = await removeProperty(id);
    if (result.success) toast.success("Propiedad eliminada");
    else toast.error(result.error ?? "Error al eliminar");
    return result;
  }

  // --- Direccion handlers ---
  function handleCreateDireccion() {
    setEditingDir(undefined);
    setDirDialogOpen(true);
  }
  function handleEditDireccion(direccion: Direccion) {
    setEditingDir(direccion);
    setDirDialogOpen(true);
  }
  async function handleSubmitDireccion(data: CreateDireccionInput) {
    const result = editingDir
      ? await updateDireccion(editingDir.id, data)
      : await createDireccion(data);
    if (result.success) {
      toast.success(editingDir ? "Dirección actualizada" : "Dirección creada");
    } else {
      toast.error(result.error ?? "Error al guardar");
    }
    return result;
  }
  async function handleDeleteDireccion(id: string) {
    const result = await removeDireccion(id);
    if (result.success) {
      toast.success("Dirección eliminada");
      await refreshProperties();
    } else {
      toast.error(result.error ?? "Error al eliminar");
    }
    return result;
  }

  const loading = loadingProps || loadingDirs;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">Propiedades</h1>
          <p className="text-sm text-muted-foreground">
            Administra tus edificios, casas y departamentos
          </p>
        </div>
        {isAdmin && (
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
            <Button variant="outline" className="w-full shrink-0 sm:w-auto" onClick={handleCreateDireccion}>
              <IconMapPin className="size-4" />
              Nueva dirección
            </Button>
            <Button className="w-full shrink-0 sm:w-auto" onClick={handleCreateProperty}>
              <IconPlus className="size-4" />
              Nueva propiedad
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : direcciones.length === 0 && properties.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <p className="text-muted-foreground">No hay propiedades ni direcciones registradas.</p>
          <p className="text-sm text-muted-foreground">
            Crea una dirección y luego agrega propiedades.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.ordered.map((g) => (
            <PropertyGroup
              key={g.direccion.id}
              direccion={g.direccion}
              properties={g.properties}
              loading={false}
              isAdmin={isAdmin}
              onEditProperty={handleEditProperty}
              onDeleteProperty={handleDeleteProperty}
              onEditDireccion={handleEditDireccion}
              onDeleteDireccion={handleDeleteDireccion}
            />
          ))}
          {groups.unassigned.length > 0 && (
            <PropertyGroup
              properties={groups.unassigned}
              loading={false}
              isAdmin={isAdmin}
              onEditProperty={handleEditProperty}
              onDeleteProperty={handleDeleteProperty}
            />
          )}
        </div>
      )}

      {isAdmin && (
        <>
          <PropertyDialog
            open={propDialogOpen}
            onOpenChange={setPropDialogOpen}
            property={editingProp}
            direcciones={direcciones}
            onSubmit={handleSubmitProperty}
          />
          <DireccionDialog
            open={dirDialogOpen}
            onOpenChange={setDirDialogOpen}
            direccion={editingDir}
            onSubmit={handleSubmitDireccion}
          />
        </>
      )}
    </div>
  );
}
