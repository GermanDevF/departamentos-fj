"use server";

import { getAccessToken } from "@/lib/auth/cookies";
import { requireAdmin } from "@/lib/auth/authorization";

/**
 * Token de sesión para el SDK en el navegador (realtime).
 * Solo administradores activos; las cookies siguen siendo httpOnly.
 */
export async function getInsforgeAccessTokenForAdminRealtime(): Promise<
  string | null
> {
  try {
    await requireAdmin();
    return (await getAccessToken()) ?? null;
  } catch {
    return null;
  }
}
