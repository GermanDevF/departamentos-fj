/** Clave opcional en el perfil de InsForge para borrar sin depender del formato de la URL. */
export const PROFILE_AVATAR_STORAGE_KEY_FIELD = "avatar_storage_key";

function storageObjectsPathPrefix(bucket: string): string {
  return `/api/storage/buckets/${bucket}/objects/`;
}

/**
 * Obtiene la clave del objeto en el bucket a partir de una URL pública de InsForge.
 * Ej.: .../api/storage/buckets/avatars/objects/profiles%2Fuuid.jpg → profiles/uuid.jpg
 */
export function objectKeyFromInsforgeStorageUrl(
  objectUrl: string,
  insforgeBaseUrl: string,
  bucket: string,
): string | null {
  try {
    const origin = new URL(insforgeBaseUrl).origin;
    const u = new URL(objectUrl);
    if (u.origin !== origin) return null;
    const prefix = storageObjectsPathPrefix(bucket);
    const i = u.pathname.indexOf(prefix);
    if (i === -1) return null;
    const encoded = u.pathname.slice(i + prefix.length);
    if (!encoded) return null;
    return decodeURIComponent(encoded);
  } catch {
    return null;
  }
}

export function resolveProfileAvatarObjectKey(
  profile: Record<string, unknown>,
  insforgeBaseUrl: string,
  bucket: string,
): string | null {
  const stored = profile[PROFILE_AVATAR_STORAGE_KEY_FIELD];
  if (typeof stored === "string" && stored.trim()) {
    return stored.trim();
  }
  const url = profile.avatar_url;
  if (typeof url === "string" && url) {
    return objectKeyFromInsforgeStorageUrl(url, insforgeBaseUrl, bucket);
  }
  return null;
}
