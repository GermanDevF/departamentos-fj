"use server";

import { requireAdmin } from "@/lib/auth/authorization";
import type { ActionResult, PropertyPhoto } from "@/types";

const BUCKET = "property-photos";
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];

function safeExtension(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  return ext && ALLOWED_EXTENSIONS.includes(ext) ? ext : "jpg";
}

export async function uploadPropertyPhoto(
  propertyId: string,
  formData: FormData,
): Promise<ActionResult<PropertyPhoto>> {
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

    const path = `properties/${propertyId}/${crypto.randomUUID()}.${safeExtension(file.name)}`;
    const { data: uploaded, error: uploadError } = await client.storage
      .from(BUCKET)
      .upload(path, file);

    if (uploadError || !uploaded?.url || !uploaded.key) {
      return {
        success: false,
        error:
          uploadError?.message ??
          "No se pudo subir la imagen. Verifica que exista el bucket «property-photos» en InsForge.",
      };
    }

    const newPhoto: PropertyPhoto = {
      url: uploaded.url,
      storage_key: uploaded.key,
    };

    const { data: current, error: fetchError } = await client.database
      .from("properties")
      .select("fotos")
      .eq("id", propertyId)
      .maybeSingle();

    if (fetchError || !current) {
      await client.storage.from(BUCKET).remove(uploaded.key);
      return { success: false, error: "No se encontró la propiedad." };
    }

    const fotos: PropertyPhoto[] = Array.isArray(
      (current as { fotos: unknown }).fotos,
    )
      ? ((current as { fotos: PropertyPhoto[] }).fotos as PropertyPhoto[])
      : [];

    fotos.push(newPhoto);

    const { error: updateError } = await client.database
      .from("properties")
      .update({ fotos })
      .eq("id", propertyId);

    if (updateError) {
      await client.storage.from(BUCKET).remove(uploaded.key);
      return {
        success: false,
        error: updateError.message ?? "Error al guardar la foto.",
      };
    }

    return { success: true, data: newPhoto };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error de conexión.";
    return { success: false, error: msg };
  }
}

export async function deletePropertyPhoto(
  propertyId: string,
  storageKey: string,
): Promise<ActionResult> {
  try {
    const { client } = await requireAdmin();

    const { data: current, error: fetchError } = await client.database
      .from("properties")
      .select("fotos")
      .eq("id", propertyId)
      .maybeSingle();

    if (fetchError || !current) {
      return { success: false, error: "No se encontró la propiedad." };
    }

    const fotos: PropertyPhoto[] = Array.isArray(
      (current as { fotos: unknown }).fotos,
    )
      ? ((current as { fotos: PropertyPhoto[] }).fotos as PropertyPhoto[])
      : [];

    const updated = fotos.filter((f) => f.storage_key !== storageKey);

    const { error: updateError } = await client.database
      .from("properties")
      .update({ fotos: updated })
      .eq("id", propertyId);

    if (updateError) {
      return {
        success: false,
        error: updateError.message ?? "Error al actualizar la propiedad.",
      };
    }

    await client.storage.from(BUCKET).remove(storageKey);

    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error de conexión.";
    return { success: false, error: msg };
  }
}

export async function getPropertyPhotos(
  propertyId: string,
): Promise<ActionResult<PropertyPhoto[]>> {
  try {
    const { client } = await requireAdmin();

    const { data, error } = await client.database
      .from("properties")
      .select("fotos")
      .eq("id", propertyId)
      .maybeSingle();

    if (error || !data) {
      return { success: false, error: "No se encontró la propiedad." };
    }

    const fotos: PropertyPhoto[] = Array.isArray(
      (data as { fotos: unknown }).fotos,
    )
      ? ((data as { fotos: PropertyPhoto[] }).fotos as PropertyPhoto[])
      : [];

    return { success: true, data: fotos };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error de conexión.";
    return { success: false, error: msg };
  }
}
