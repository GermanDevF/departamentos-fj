"use server";

import { requireAuth, requireAdmin } from "@/lib/auth/authorization";
import type {
  Property,
  Contract,
  CreatePropertyInput,
  UpdatePropertyInput,
  ActionResult,
} from "@/types";

export async function getProperties(): Promise<ActionResult<Property[]>> {
  try {
    const { client } = await requireAuth();
    const { data, error } = await client.database
      .from("properties")
      .select()
      .order("created_at", { ascending: false });

    if (error) return { success: false, error: error.message ?? "Error al obtener propiedades." };
    return { success: true, data: (data as Property[]) ?? [] };
  } catch {
    return { success: false, error: "Error de conexión." };
  }
}

export async function getProperty(id: string): Promise<ActionResult<Property>> {
  try {
    const { client } = await requireAuth();
    const { data, error } = await client.database
      .from("properties")
      .select()
      .eq("id", id)
      .maybeSingle();

    if (error) return { success: false, error: error.message ?? "Error al obtener propiedad." };
    if (!data) return { success: false, error: "Propiedad no encontrada." };
    return { success: true, data: data as Property };
  } catch {
    return { success: false, error: "Error de conexión." };
  }
}

export async function createProperty(
  input: CreatePropertyInput,
): Promise<ActionResult<Property>> {
  if (!input.nombre?.trim()) return { success: false, error: "El nombre es requerido." };
  if (!input.direccion?.trim()) return { success: false, error: "La dirección es requerida." };

  try {
    const { client, userId } = await requireAdmin();
    const { data, error } = await client.database
      .from("properties")
      .insert([
        {
          user_id: userId,
          nombre: input.nombre.trim(),
          direccion: input.direccion.trim(),
          descripcion: input.descripcion?.trim() || null,
          disponible: input.disponible ?? true,
        },
      ])
      .select();

    if (error) return { success: false, error: error.message ?? "Error al crear propiedad." };
    return { success: true, data: (data as Property[])?.[0] };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error de conexión.";
    return { success: false, error: msg };
  }
}

export async function updateProperty(
  id: string,
  input: UpdatePropertyInput,
): Promise<ActionResult<Property>> {
  const updates: Record<string, unknown> = {};
  if (input.nombre !== undefined) updates.nombre = input.nombre.trim();
  if (input.direccion !== undefined) updates.direccion = input.direccion.trim();
  if (input.descripcion !== undefined)
    updates.descripcion = input.descripcion?.trim() || null;
  if (input.disponible !== undefined) updates.disponible = input.disponible;

  if (Object.keys(updates).length === 0)
    return { success: false, error: "No hay cambios." };

  try {
    const { client } = await requireAdmin();

    if (input.disponible !== undefined) {
      const { data: activeContracts } = await client.database
        .from("contracts")
        .select("id")
        .eq("propiedad_id", id)
        .eq("activo", true);

      if (activeContracts && (activeContracts as Contract[]).length > 0)
        return {
          success: false,
          error: "No se puede cambiar la disponibilidad mientras exista un contrato activo.",
        };
    }
    const { data, error } = await client.database
      .from("properties")
      .update(updates)
      .eq("id", id)
      .select();

    if (error) return { success: false, error: error.message ?? "Error al actualizar." };
    return { success: true, data: (data as Property[])?.[0] };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error de conexión.";
    return { success: false, error: msg };
  }
}

export async function deleteProperty(id: string): Promise<ActionResult> {
  try {
    const { client } = await requireAdmin();
    const { error } = await client.database
      .from("properties")
      .delete()
      .eq("id", id);

    if (error) return { success: false, error: error.message ?? "Error al eliminar." };
    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error de conexión.";
    return { success: false, error: msg };
  }
}
