"use server";

import { requireAuth, requireAdmin } from "@/lib/auth/authorization";
import type {
  Direccion,
  CreateDireccionInput,
  UpdateDireccionInput,
  ActionResult,
} from "@/types";

export async function getDirecciones(): Promise<ActionResult<Direccion[]>> {
  try {
    const { client } = await requireAuth();
    const { data, error } = await client.database
      .from("direcciones")
      .select()
      .order("nombre", { ascending: true });

    if (error) return { success: false, error: error.message ?? "Error al obtener direcciones." };
    return { success: true, data: (data as Direccion[]) ?? [] };
  } catch {
    return { success: false, error: "Error de conexión." };
  }
}

export async function getDireccion(id: string): Promise<ActionResult<Direccion>> {
  try {
    const { client } = await requireAuth();
    const { data, error } = await client.database
      .from("direcciones")
      .select()
      .eq("id", id)
      .maybeSingle();

    if (error) return { success: false, error: error.message ?? "Error al obtener dirección." };
    if (!data) return { success: false, error: "Dirección no encontrada." };
    return { success: true, data: data as Direccion };
  } catch {
    return { success: false, error: "Error de conexión." };
  }
}

export async function createDireccion(
  input: CreateDireccionInput,
): Promise<ActionResult<Direccion>> {
  if (!input.nombre?.trim()) return { success: false, error: "El nombre es requerido." };
  if (!input.calle?.trim()) return { success: false, error: "La calle es requerida." };
  if (!input.numero_exterior?.trim()) return { success: false, error: "El número exterior es requerido." };
  if (!input.colonia?.trim()) return { success: false, error: "La colonia es requerida." };
  if (!input.ciudad?.trim()) return { success: false, error: "La ciudad es requerida." };
  if (!input.estado?.trim()) return { success: false, error: "El estado es requerido." };

  try {
    const { client, userId } = await requireAdmin();
    const { data, error } = await client.database
      .from("direcciones")
      .insert([
        {
          user_id: userId,
          nombre: input.nombre.trim(),
          calle: input.calle.trim(),
          numero_exterior: input.numero_exterior.trim(),
          numero_interior: input.numero_interior?.trim() || null,
          colonia: input.colonia.trim(),
          ciudad: input.ciudad.trim(),
          estado: input.estado.trim(),
          cp: input.cp?.trim() || null,
          notas: input.notas?.trim() || null,
        },
      ])
      .select();

    if (error) return { success: false, error: error.message ?? "Error al crear dirección." };
    return { success: true, data: (data as Direccion[])?.[0] };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error de conexión.";
    return { success: false, error: msg };
  }
}

export async function updateDireccion(
  id: string,
  input: UpdateDireccionInput,
): Promise<ActionResult<Direccion>> {
  const updates: Record<string, unknown> = {};
  if (input.nombre !== undefined) updates.nombre = input.nombre.trim();
  if (input.calle !== undefined) updates.calle = input.calle.trim();
  if (input.numero_exterior !== undefined) updates.numero_exterior = input.numero_exterior.trim();
  if (input.numero_interior !== undefined) updates.numero_interior = input.numero_interior?.trim() || null;
  if (input.colonia !== undefined) updates.colonia = input.colonia.trim();
  if (input.ciudad !== undefined) updates.ciudad = input.ciudad.trim();
  if (input.estado !== undefined) updates.estado = input.estado.trim();
  if (input.cp !== undefined) updates.cp = input.cp?.trim() || null;
  if (input.notas !== undefined) updates.notas = input.notas?.trim() || null;

  if (Object.keys(updates).length === 0)
    return { success: false, error: "No hay cambios." };

  try {
    const { client } = await requireAdmin();
    const { data, error } = await client.database
      .from("direcciones")
      .update(updates)
      .eq("id", id)
      .select();

    if (error) return { success: false, error: error.message ?? "Error al actualizar." };
    return { success: true, data: (data as Direccion[])?.[0] };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error de conexión.";
    return { success: false, error: msg };
  }
}

export async function deleteDireccion(id: string): Promise<ActionResult> {
  try {
    const { client } = await requireAdmin();
    const { error } = await client.database
      .from("direcciones")
      .delete()
      .eq("id", id);

    if (error) return { success: false, error: error.message ?? "Error al eliminar." };
    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error de conexión.";
    return { success: false, error: msg };
  }
}
