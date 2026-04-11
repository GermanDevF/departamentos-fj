"use server";

import { createInsForgeServerClient } from "@/lib/insforge/server";
import {
  setAuthCookies,
  getAccessToken,
  getRefreshToken,
  clearAuthCookies,
} from "@/lib/auth/cookies";
import type { AuthResult, AuthUser, SignUpResult } from "@/lib/auth/types";

export async function signIn(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { success: false, error: "Email y contraseña son requeridos." };
  }

  try {
    const insforge = createInsForgeServerClient();
    const { data, error } = await insforge.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.statusCode === 403) {
        return {
          success: false,
          error:
            "Tu email no ha sido verificado. Revisa tu bandeja de entrada.",
        };
      }
      return {
        success: false,
        error: "Credenciales inválidas. Verifica tu email y contraseña.",
      };
    }

    if (!data?.accessToken || !data?.refreshToken) {
      return { success: false, error: "Error al iniciar sesión." };
    }

    await setAuthCookies(data.accessToken, data.refreshToken);
    return { success: true };
  } catch {
    return { success: false, error: "Error de conexión. Intenta de nuevo." };
  }
}

export async function signUp(formData: FormData): Promise<SignUpResult> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || !password) {
    return {
      success: false,
      error: "Nombre, email y contraseña son requeridos.",
    };
  }

  if (password.length < 8) {
    return {
      success: false,
      error: "La contraseña debe tener al menos 8 caracteres.",
    };
  }

  try {
    const insforge = createInsForgeServerClient();
    const { data, error } = await insforge.auth.signUp({
      email,
      password,
      name,
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/login`,
    });

    if (error) {
      if (
        error.message?.toLowerCase().includes("already") ||
        error.message?.toLowerCase().includes("exists")
      ) {
        return {
          success: false,
          error: "Ya existe una cuenta con este email.",
        };
      }
      return {
        success: false,
        error: error.message ?? "Error al crear la cuenta.",
      };
    }

    if (data?.requireEmailVerification) {
      return {
        success: true,
        requireEmailVerification: true,
        verifyEmailMethod: "code",
      };
    }

    if (data?.accessToken && data?.refreshToken) {
      await setAuthCookies(data.accessToken, data.refreshToken);
      return { success: true };
    }

    return { success: true };
  } catch {
    return { success: false, error: "Error de conexión. Intenta de nuevo." };
  }
}

export async function verifyEmail(
  email: string,
  otp: string,
): Promise<AuthResult> {
  try {
    const insforge = createInsForgeServerClient();
    const { data, error } = await insforge.auth.verifyEmail({ email, otp });

    if (error) {
      return {
        success: false,
        error: "Código inválido o expirado. Intenta de nuevo.",
      };
    }

    if (data?.accessToken && data?.refreshToken) {
      await setAuthCookies(data.accessToken, data.refreshToken);
    }

    return { success: true };
  } catch {
    return { success: false, error: "Error de conexión. Intenta de nuevo." };
  }
}

export async function resendVerification(email: string): Promise<AuthResult> {
  try {
    const insforge = createInsForgeServerClient();
    await insforge.auth.resendVerificationEmail({
      email,
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/login`,
    });
    return { success: true };
  } catch {
    return {
      success: false,
      error: "No se pudo reenviar el email de verificación.",
    };
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
      const refreshed = await refreshSession();
      if (!refreshed) return null;
      accessToken = await getAccessToken();
      if (!accessToken) return null;
    }

    const insforge = createInsForgeServerClient(accessToken);
    const { data, error } = await insforge.auth.getCurrentUser();

    if (error || !data?.user) {
      const refreshed = await refreshSession();
      if (!refreshed) return null;

      const newToken = await getAccessToken();
      if (!newToken) return null;

      const retryClient = createInsForgeServerClient(newToken);
      const retry = await retryClient.auth.getCurrentUser();
      if (retry.error || !retry.data?.user) return null;
      return mapUser(retry.data.user);
    }

    return mapUser(data.user);
  } catch {
    return null;
  }
}

function mapUser(raw: Record<string, unknown>): AuthUser {
  const profile = (raw.profile as Record<string, unknown>) ?? {};
  return {
    id: raw.id as string,
    email: raw.email as string,
    name: (profile.name as string) ?? null,
    avatarUrl: (profile.avatar_url as string) ?? null,
    emailVerified: raw.emailVerified as boolean,
    createdAt: raw.createdAt as string,
  };
}

async function refreshSession(): Promise<boolean> {
  try {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return false;

    const insforge = createInsForgeServerClient();
    const { data, error } = await insforge.auth.refreshSession({
      refreshToken,
    });

    if (error || !data?.accessToken || !data?.refreshToken) return false;

    await setAuthCookies(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}
