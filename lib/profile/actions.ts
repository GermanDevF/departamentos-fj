"use server";

import { getAccessToken } from "@/lib/auth/cookies";
import { refreshSessionFromCookies } from "@/lib/auth/refresh-session";
import { createInsForgeServerClient } from "@/lib/insforge/server";
import {
  PROFILE_AVATAR_STORAGE_KEY_FIELD,
  resolveProfileAvatarObjectKey,
} from "@/lib/profile/avatar-storage";

/** Bucket de almacenamiento para fotos de perfil (créalo en InsForge si no existe). */
const AVATARS_BUCKET = "avatars";

async function fetchCurrentProfileMap(
  client: ReturnType<typeof createInsForgeServerClient>,
): Promise<Record<string, unknown>> {
  const { data, error } = await client.auth.getCurrentUser();
  if (error || !data?.user) return {};
  const raw = data.user as Record<string, unknown>;
  return (raw.profile as Record<string, unknown>) ?? {};
}

export type SaveProfileResult =
  | { success: true }
  | { success: false; error: string };

async function clientWithValidSession() {
  let token = await getAccessToken();
  if (!token) {
    const ok = await refreshSessionFromCookies();
    if (!ok) return null;
    token = await getAccessToken();
  }
  if (!token) return null;
  return createInsForgeServerClient(token);
}

export async function saveMyProfileSettings(
  formData: FormData,
): Promise<SaveProfileResult> {
  const name = String(formData.get("name") ?? "").trim();
  const removeAvatar = formData.get("removeAvatar") === "true";
  const avatar = formData.get("avatar");
  const rawTc = formData.get("default_tipo_cambio");
  const defaultTipoCambio =
    rawTc && Number(rawTc) > 0 ? Number(rawTc) : null;

  if (!name) {
    return { success: false, error: "El nombre es obligatorio." };
  }

  const insforgeBaseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL?.trim();
  if (!insforgeBaseUrl) {
    return {
      success: false,
      error: "Falta la variable de entorno NEXT_PUBLIC_INSFORGE_URL.",
    };
  }

  const client = await clientWithValidSession();
  if (!client) {
    return {
      success: false,
      error: "Sesión no válida. Vuelve a iniciar sesión.",
    };
  }

  const previousProfile = await fetchCurrentProfileMap(client);
  const previousObjectKey = resolveProfileAvatarObjectKey(
    previousProfile,
    insforgeBaseUrl,
    AVATARS_BUCKET,
  );

  let avatarUrl: string | null | undefined;
  let newObjectKey: string | undefined;

  if (removeAvatar) {
    avatarUrl = null;
  } else if (avatar instanceof File && avatar.size > 0) {
    if (!avatar.type.startsWith("image/")) {
      return { success: false, error: "El archivo debe ser una imagen." };
    }
    if (avatar.size > 5 * 1024 * 1024) {
      return { success: false, error: "La imagen no puede superar 5 MB." };
    }
    const ext = avatar.name.split(".").pop()?.toLowerCase();
    const safeExt =
      ext && ["jpg", "jpeg", "png", "gif", "webp"].includes(ext) ? ext : "jpg";
    const path = `profiles/${crypto.randomUUID()}.${safeExt}`;
    const { data: uploaded, error: uploadError } = await client.storage
      .from(AVATARS_BUCKET)
      .upload(path, avatar);

    if (uploadError || !uploaded?.url || !uploaded.key) {
      return {
        success: false,
        error:
          uploadError?.message ??
          "No se pudo subir la imagen. Verifica que exista el bucket «avatars» en InsForge.",
      };
    }
    avatarUrl = uploaded.url;
    newObjectKey = uploaded.key;
  }

  const payload: Record<string, unknown> = { name, default_tipo_cambio: defaultTipoCambio };
  if (avatarUrl !== undefined) {
    payload.avatar_url = avatarUrl;
    if (avatarUrl === null) {
      payload[PROFILE_AVATAR_STORAGE_KEY_FIELD] = null;
    } else if (newObjectKey) {
      payload[PROFILE_AVATAR_STORAGE_KEY_FIELD] = newObjectKey;
    }
  }

  const { error } = await client.auth.setProfile(payload);
  if (error) {
    if (newObjectKey) {
      await client.storage.from(AVATARS_BUCKET).remove(newObjectKey);
    }
    return {
      success: false,
      error: error.message ?? "No se pudo guardar el perfil.",
    };
  }

  if (avatarUrl !== undefined && previousObjectKey) {
    const keyToDelete =
      newObjectKey && previousObjectKey === newObjectKey
        ? null
        : previousObjectKey;
    if (keyToDelete) {
      await client.storage.from(AVATARS_BUCKET).remove(keyToDelete);
    }
  }

  return { success: true };
}
