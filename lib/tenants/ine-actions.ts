"use server";

import { requireAdmin } from "@/lib/auth/authorization";
import type { Tenant, ActionResult } from "@/types";

const BUCKET = "tenant-documents";
const MAX_SIZE = 500 * 1024 * 1024; // 500 MB
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];

type IneSide = "frontal" | "trasera";

function safeExtension(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  return ext && ALLOWED_EXTENSIONS.includes(ext) ? ext : "jpg";
}

export async function uploadTenantIne(
  tenantId: string,
  side: IneSide,
  formData: FormData,
): Promise<ActionResult<{ url: string; key: string }>> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "No se proporcionó un archivo." };
  }
  if (!file.type.startsWith("image/")) {
    return { success: false, error: "El archivo debe ser una imagen." };
  }
  if (file.size > MAX_SIZE) {
    return { success: false, error: "La imagen no puede superar 5 MB." };
  }

  try {
    const { client } = await requireAdmin();

    const { data: tenant, error: fetchError } = await client.database
      .from("tenants")
      .select("id, ine_frontal_key, ine_trasera_key")
      .eq("id", tenantId)
      .maybeSingle();

    console.log(JSON.stringify({ tenant, side, fetchError }, null, 2));

    if (fetchError || !tenant) {
      return { success: false, error: "No se encontró el inquilino." };
    }

    const t = tenant as Record<string, unknown>;
    const previousKey = (t[`ine_${side}_key`] as string | null) ?? null;

    const path = `tenants/${tenantId}/ine_${side}_${crypto.randomUUID()}.${safeExtension(file.name)}`;
    const { data: uploaded, error: uploadError } = await client.storage
      .from(BUCKET)
      .upload(path, file);

    if (uploadError || !uploaded?.url || !uploaded.key) {
      return {
        success: false,
        error:
          uploadError?.message ??
          "No se pudo subir la imagen. Verifica que exista el bucket «tenant-documents» en InsForge.",
      };
    }

    const updates: Record<string, string | null> = {
      [`ine_${side}_url`]: uploaded.url,
      [`ine_${side}_key`]: uploaded.key,
    };

    const { error: updateError } = await client.database
      .from("tenants")
      .update(updates)
      .eq("id", tenantId);

    if (updateError) {
      await client.storage.from(BUCKET).remove(uploaded.key);
      return {
        success: false,
        error: updateError.message ?? "Error al guardar la imagen.",
      };
    }

    if (previousKey) {
      await client.storage.from(BUCKET).remove(previousKey);
    }

    return { success: true, data: { url: uploaded.url, key: uploaded.key } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error de conexión.";
    return { success: false, error: msg };
  }
}

export async function removeTenantIne(
  tenantId: string,
  side: IneSide,
): Promise<ActionResult> {
  try {
    const { client } = await requireAdmin();

    const { data: tenant, error: fetchError } = await client.database
      .from("tenants")
      .select("id, ine_frontal_key, ine_trasera_key")
      .eq("id", tenantId)
      .maybeSingle();

    if (fetchError || !tenant) {
      return { success: false, error: "No se encontró el inquilino." };
    }

    const t = tenant as Record<string, unknown>;
    const storageKey = (t[`ine_${side}_key`] as string | null) ?? null;

    const updates: Record<string, null> = {
      [`ine_${side}_url`]: null,
      [`ine_${side}_key`]: null,
    };

    const { error: updateError } = await client.database
      .from("tenants")
      .update(updates)
      .eq("id", tenantId);

    if (updateError) {
      return {
        success: false,
        error: updateError.message ?? "Error al actualizar.",
      };
    }

    if (storageKey) {
      await client.storage.from(BUCKET).remove(storageKey);
    }

    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error de conexión.";
    return { success: false, error: msg };
  }
}

export async function getTenantIne(tenantId: string): Promise<
  ActionResult<{
    frontal: { url: string | null; key: string | null };
    trasera: { url: string | null; key: string | null };
  }>
> {
  try {
    const { client } = await requireAdmin();

    const { data, error } = await client.database
      .from("tenants")
      .select(
        "ine_frontal_url, ine_frontal_key, ine_trasera_url, ine_trasera_key",
      )
      .eq("id", tenantId)
      .maybeSingle();

    if (error || !data) {
      return { success: false, error: "No se encontró el inquilino." };
    }

    const t = data as Tenant;
    return {
      success: true,
      data: {
        frontal: { url: t.ine_frontal_url, key: t.ine_frontal_key },
        trasera: { url: t.ine_trasera_url, key: t.ine_trasera_key },
      },
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error de conexión.";
    return { success: false, error: msg };
  }
}
