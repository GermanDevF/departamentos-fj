"use server";

import { createInsForgeServerClient } from "@/lib/insforge/server";
import {
  setAuthCookies,
  getAccessToken,
  clearAuthCookies,
} from "@/lib/auth/cookies";
import { refreshSessionFromCookies } from "@/lib/auth/refresh-session";
import { authenticateUser, checkUserActiveStatus } from "@/lib/auth/services";
import type { AuthResult, AuthUser, UserRole } from "@/lib/auth/types";

export async function signIn(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { success: false, error: "Email y contraseña son requeridos." };
  }

  try {
    const result = await authenticateUser(email, password);

    if (!result.success) {
      return { success: false, error: result.error, code: result.code };
    }

    await setAuthCookies(result.accessToken!, result.refreshToken!);
    return { success: true };
  } catch {
    return { success: false, error: "Error de conexión. Intenta de nuevo." };
  }
}

export async function signOut(): Promise<AuthResult> {
  try {
    const accessToken = await getAccessToken();
    if (accessToken) {
      const insforge = createInsForgeServerClient(accessToken);
      await insforge.auth.signOut();
    }
    await clearAuthCookies();
    return { success: true };
  } catch {
    await clearAuthCookies();
    return { success: true };
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    let accessToken = await getAccessToken();

    if (!accessToken) {
      const refreshed = await refreshSessionFromCookies();
      if (!refreshed) return null;
      accessToken = await getAccessToken();
      if (!accessToken) return null;
    }

    const insforge = createInsForgeServerClient(accessToken);
    const { data, error } = await insforge.auth.getCurrentUser();

    if (error || !data?.user) {
      const refreshed = await refreshSessionFromCookies();
      if (!refreshed) return null;

      const newToken = await getAccessToken();
      if (!newToken) return null;

      const retryClient = createInsForgeServerClient(newToken);
      const retry = await retryClient.auth.getCurrentUser();
      if (retry.error || !retry.data?.user) return null;

      return buildAuthUser(retryClient, retry.data.user);
    }

    return buildAuthUser(insforge, data.user);
  } catch {
    return null;
  }
}

async function buildAuthUser(
  client: ReturnType<typeof createInsForgeServerClient>,
  raw: Record<string, unknown>,
): Promise<AuthUser | null> {
  const userId = raw.id as string;
  const profileStatus = await checkUserActiveStatus(client, userId);

  if (!profileStatus || !profileStatus.isActive) return null;

  const profile = (raw.profile as Record<string, unknown>) ?? {};
  return {
    id: userId,
    email: raw.email as string,
    name: (profile.name as string) ?? null,
    avatarUrl: (profile.avatar_url as string) ?? null,
    emailVerified: raw.emailVerified as boolean,
    createdAt: raw.createdAt as string,
    role: profileStatus.role as UserRole,
    isActive: profileStatus.isActive,
  };
}

export async function resendVerificationEmail(
  email: string,
): Promise<AuthResult> {
  if (!email?.trim()) {
    return { success: false, error: "El email es requerido." };
  }

  try {
    const insforge = createInsForgeServerClient();
    const { error } = await insforge.auth.resendVerificationEmail({
      email: email.trim(),
    });

    if (error) {
      return {
        success: false,
        error: error.message ?? "Error al reenviar el correo.",
      };
    }

    return { success: true };
  } catch {
    return { success: false, error: "Error de conexión. Intenta de nuevo." };
  }
}

