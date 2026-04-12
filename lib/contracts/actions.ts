"use server";

import { requireAuth, requireAdmin } from "@/lib/auth/authorization";
import type {
  Contract,
  Property,
  Tenant,
  CreateContractInput,
  UpdateContractInput,
  ActionResult,
} from "@/types";

export interface ContractRow extends Contract {
  properties: Property;
  tenants: Tenant;
}

export async function getContracts(): Promise<ActionResult<ContractRow[]>> {
  try {
    const { client } = await requireAuth();
    const { data, error } = await client.database
      .from("contracts")
      .select("*, properties(*), tenants(*)")
      .order("created_at", { ascending: false });

    if (error) return { success: false, error: error.message ?? "Error al obtener contratos." };
    return { success: true, data: (data as ContractRow[]) ?? [] };
  } catch {
    return { success: false, error: "Error de conexión." };
  }
}

export async function createContract(
  input: CreateContractInput,
): Promise<ActionResult<Contract>> {
  if (!input.propiedad_id) return { success: false, error: "La propiedad es requerida." };
  if (!input.inquilino_id) return { success: false, error: "El inquilino es requerido." };
  if (!input.fecha_inicio) return { success: false, error: "La fecha de inicio es requerida." };
  if (!input.precio_mensual || input.precio_mensual <= 0)
    return { success: false, error: "El precio mensual debe ser mayor a 0." };
  if (!input.dia_pago || input.dia_pago < 1 || input.dia_pago > 31)
    return { success: false, error: "El día de pago debe estar entre 1 y 31." };
  if (!input.tipo_duracion)
    return { success: false, error: "El tipo de duración es requerido." };
  if (input.tipo_duracion !== "indefinido" && (!input.duracion_cantidad || input.duracion_cantidad <= 0))
    return { success: false, error: "La cantidad de duración debe ser mayor a 0." };

  try {
    const { client, userId } = await requireAdmin();

    const { data: prop, error: propError } = await client.database
      .from("properties")
      .select("id, disponible")
      .eq("id", input.propiedad_id)
      .maybeSingle();

    if (propError || !prop)
      return { success: false, error: "Propiedad no encontrada." };

    if (!(prop as Property).disponible)
      return {
        success: false,
        error: "Esta propiedad no está disponible. Tiene un contrato activo.",
      };

    const { data, error } = await client.database
      .from("contracts")
      .insert([
        {
          user_id: userId,
          propiedad_id: input.propiedad_id,
          inquilino_id: input.inquilino_id,
          fecha_inicio: input.fecha_inicio,
          tipo_duracion: input.tipo_duracion,
          duracion_cantidad: input.tipo_duracion === "indefinido" ? null : input.duracion_cantidad,
          precio_mensual: input.precio_mensual,
          dia_pago: input.dia_pago,
          activo: true,
        },
      ])
      .select();

    if (error) return { success: false, error: error.message ?? "Error al crear contrato." };

    await client.database
      .from("properties")
      .update({ disponible: false })
      .eq("id", input.propiedad_id);

    return { success: true, data: (data as Contract[])?.[0] };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error de conexión.";
    return { success: false, error: msg };
  }
}

export async function updateContract(
  id: string,
  input: UpdateContractInput,
): Promise<ActionResult<Contract>> {
  const updates: Record<string, unknown> = {};

  if (input.fecha_inicio !== undefined) updates.fecha_inicio = input.fecha_inicio;
  if (input.tipo_duracion !== undefined) {
    updates.tipo_duracion = input.tipo_duracion;
    if (input.tipo_duracion === "indefinido") {
      updates.duracion_cantidad = null;
    }
  }
  if (input.duracion_cantidad !== undefined) updates.duracion_cantidad = input.duracion_cantidad;
  if (input.precio_mensual !== undefined) {
    if (input.precio_mensual <= 0)
      return { success: false, error: "El precio mensual debe ser mayor a 0." };
    updates.precio_mensual = input.precio_mensual;
  }
  if (input.dia_pago !== undefined) {
    if (input.dia_pago < 1 || input.dia_pago > 31)
      return { success: false, error: "El día de pago debe estar entre 1 y 31." };
    updates.dia_pago = input.dia_pago;
  }
  if (input.activo !== undefined) updates.activo = input.activo;

  if (Object.keys(updates).length === 0)
    return { success: false, error: "No hay cambios." };

  try {
    const { client } = await requireAdmin();
    const { data, error } = await client.database
      .from("contracts")
      .update(updates)
      .eq("id", id)
      .select();

    if (error) return { success: false, error: error.message ?? "Error al actualizar." };
    return { success: true, data: (data as Contract[])?.[0] };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error de conexión.";
    return { success: false, error: msg };
  }
}

export async function deactivateContract(id: string): Promise<ActionResult> {
  try {
    const { client } = await requireAdmin();

    const { data: contractData, error: fetchError } = await client.database
      .from("contracts")
      .select("propiedad_id")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !contractData)
      return { success: false, error: "Contrato no encontrado." };

    const { error } = await client.database
      .from("contracts")
      .update({ activo: false })
      .eq("id", id);

    if (error) return { success: false, error: error.message ?? "Error al desactivar." };

    await client.database
      .from("properties")
      .update({ disponible: true })
      .eq("id", (contractData as Contract).propiedad_id);

    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error de conexión.";
    return { success: false, error: msg };
  }
}

export async function deleteContract(id: string): Promise<ActionResult> {
  try {
    const { client } = await requireAdmin();

    const { data: contractData, error: fetchError } = await client.database
      .from("contracts")
      .select("propiedad_id, activo")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !contractData)
      return { success: false, error: "Contrato no encontrado." };

    const wasActive = (contractData as Contract).activo;
    const propiedadId = (contractData as Contract).propiedad_id;

    const { error } = await client.database
      .from("contracts")
      .delete()
      .eq("id", id);

    if (error) return { success: false, error: error.message ?? "Error al eliminar." };

    if (wasActive) {
      await client.database
        .from("properties")
        .update({ disponible: true })
        .eq("id", propiedadId);
    }

    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error de conexión.";
    return { success: false, error: msg };
  }
}

export async function getPropertyCount(): Promise<number> {
  try {
    const { client } = await requireAuth();
    const { data } = await client.database
      .from("properties")
      .select("id", { count: "exact" });
    return (data as unknown[])?.length ?? 0;
  } catch {
    return 0;
  }
}

export async function getTenantCount(): Promise<number> {
  try {
    const { client } = await requireAuth();
    const { data } = await client.database
      .from("tenants")
      .select("id", { count: "exact" });
    return (data as unknown[])?.length ?? 0;
  } catch {
    return 0;
  }
}

export async function getActiveContractCount(): Promise<number> {
  try {
    const { client } = await requireAuth();
    const { data } = await client.database
      .from("contracts")
      .select("id", { count: "exact" })
      .eq("activo", true);
    return (data as unknown[])?.length ?? 0;
  } catch {
    return 0;
  }
}
