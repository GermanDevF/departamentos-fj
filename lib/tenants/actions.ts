"use server";

import { requireAuth, requireAdmin } from "@/lib/auth/authorization";
import type {
  Tenant,
  CreateTenantInput,
  UpdateTenantInput,
  ActionResult,
} from "@/types";

export async function getTenants(): Promise<ActionResult<Tenant[]>> {
  try {
    const { client } = await requireAuth();
    const { data, error } = await client.database
      .from("tenants")
      .select()
      .order("created_at", { ascending: false });

    if (error) return { success: false, error: error.message ?? "Error al obtener inquilinos." };
    return { success: true, data: (data as Tenant[]) ?? [] };
  } catch {
    return { success: false, error: "Error de conexión." };
  }
}

export async function getTenant(id: string): Promise<ActionResult<Tenant>> {
  try {
    const { client } = await requireAuth();
    const { data, error } = await client.database
      .from("tenants")
      .select()
      .eq("id", id)
      .maybeSingle();

    if (error) return { success: false, error: error.message ?? "Error al obtener inquilino." };
    if (!data) return { success: false, error: "Inquilino no encontrado." };
    return { success: true, data: data as Tenant };
  } catch {
    return { success: false, error: "Error de conexión." };
  }
}

export async function createTenant(
  input: CreateTenantInput,
): Promise<ActionResult<Tenant>> {
  if (!input.nombre?.trim()) return { success: false, error: "El nombre es requerido." };
  if (!input.telefono?.trim()) return { success: false, error: "El teléfono es requerido." };

  try {
    const { client, userId } = await requireAdmin();
    const { data, error } = await client.database
      .from("tenants")
      .insert([
        {
          user_id: userId,
          nombre: input.nombre.trim(),
          telefono: input.telefono.trim(),
          email: input.email?.trim() || null,
        },
      ])
      .select();

    if (error) return { success: false, error: error.message ?? "Error al crear inquilino." };
    return { success: true, data: (data as Tenant[])?.[0] };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error de conexión.";
    return { success: false, error: msg };
  }
}

export async function updateTenant(
  id: string,
  input: UpdateTenantInput,
): Promise<ActionResult<Tenant>> {
  const updates: Record<string, unknown> = {};
  if (input.nombre !== undefined) updates.nombre = input.nombre.trim();
  if (input.telefono !== undefined) updates.telefono = input.telefono.trim();
  if (input.email !== undefined) updates.email = input.email?.trim() || null;

  if (Object.keys(updates).length === 0)
    return { success: false, error: "No hay cambios." };

  try {
    const { client } = await requireAdmin();
    const { data, error } = await client.database
      .from("tenants")
      .update(updates)
      .eq("id", id)
      .select();

    if (error) return { success: false, error: error.message ?? "Error al actualizar." };
    return { success: true, data: (data as Tenant[])?.[0] };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error de conexión.";
    return { success: false, error: msg };
  }
}

export async function deleteTenant(id: string): Promise<ActionResult> {
  try {
    const { client } = await requireAdmin();
    const { error } = await client.database
      .from("tenants")
      .delete()
      .eq("id", id);

    if (error) return { success: false, error: error.message ?? "Error al eliminar." };
    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error de conexión.";
    return { success: false, error: msg };
  }
}
