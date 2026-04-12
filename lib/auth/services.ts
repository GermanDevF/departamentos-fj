import { createInsForgeServerClient } from "@/lib/insforge/server";
import type { AuthResult } from "@/lib/auth/types";
import type { ActionResult } from "@/types";

interface UserProfileStatus {
  role: string;
  isActive: boolean;
}

/** userId devuelto por InsForge tras signUp (formas de respuesta distintas). */
export function extractUserIdFromSignUpResponse(
  data: unknown,
): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const d = data as Record<string, unknown>;
  const user = d.user;
  if (user && typeof user === "object") {
    const id = (user as Record<string, unknown>).id;
    if (typeof id === "string" && id.length > 0) return id;
  }
  const alt = d.userId ?? d.user_id;
  if (typeof alt === "string" && alt.length > 0) return alt;
  return undefined;
}

/** Perfil de app para registro self-service: staff pendiente de aprobación. */
export async function upsertStaffPendingProfile(
  client: ReturnType<typeof createInsForgeServerClient>,
  userId: string,
): Promise<{ error: string | null }> {
  const { error } = await client.database
    .from("user_profiles")
    .upsert(
      { user_id: userId, role: "staff", is_active: false },
      { onConflict: "user_id" },
    );
  return { error: error?.message ?? null };
}

export async function ensureProfile(
  client: ReturnType<typeof createInsForgeServerClient>,
  userId: string,
): Promise<void> {
  await client.database
    .from("user_profiles")
    .upsert(
      { user_id: userId, role: "staff", is_active: false },
      { onConflict: "user_id", ignoreDuplicates: true },
    );
}

export async function checkUserActiveStatus(
  client: ReturnType<typeof createInsForgeServerClient>,
  userId: string,
): Promise<UserProfileStatus | null> {
  const { data, error } = await client.database.rpc("get_user_profile_status", {
    p_user_id: userId,
  });

  if (error || !data) {
    await ensureProfile(client, userId);
    return { role: "staff", isActive: false };
  }

  const rows = data as Record<string, unknown>[];
  const row = Array.isArray(rows) ? rows[0] : (data as Record<string, unknown>);
  if (!row) {
    await ensureProfile(client, userId);
    return { role: "staff", isActive: false };
  }

  return {
    role: (row.role as string) ?? "staff",
    isActive: row.is_active === true,
  };
}

export async function authenticateUser(
  email: string,
  password: string,
): Promise<AuthResult & { accessToken?: string; refreshToken?: string }> {
  const insforge = createInsForgeServerClient();

  const { data, error } = await insforge.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.statusCode === 403) {
      return {
        success: false,
        code: "email_not_verified",
        error: "Tu email no ha sido verificado. Revisa tu bandeja de entrada.",
      };
    }
    return {
      success: false,
      code: "invalid_credentials",
      error: "Credenciales inválidas. Verifica tu email y contraseña.",
    };
  }

  if (!data?.accessToken || !data?.refreshToken) {
    return { success: false, error: "Error al iniciar sesión." };
  }

  const authedClient = createInsForgeServerClient(data.accessToken);
  const { data: userData } = await authedClient.auth.getCurrentUser();
  const userId = (userData?.user as Record<string, unknown>)?.id as
    | string
    | undefined;

  if (!userId) {
    return { success: false, error: "Error al obtener datos del usuario." };
  }

  const profile = await checkUserActiveStatus(authedClient, userId);

  if (!profile) {
    return {
      success: false,
      code: "no_profile",
      error: "No se encontró un perfil asociado a esta cuenta.",
    };
  }

  if (!profile.isActive) {
    return {
      success: false,
      code: "pending_approval",
      error: "Tu cuenta está pendiente de aprobación por un administrador.",
    };
  }

  return {
    success: true,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  };
}

export async function requestAccountCreation(input: {
  name: string;
  email: string;
  password: string;
}): Promise<ActionResult> {
  const insforge = createInsForgeServerClient();

  const { data: signUpData, error: signUpError } = await insforge.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    name: input.name.trim(),
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/verify-email`,
  });

  if (signUpError) {
    if (
      signUpError.message?.toLowerCase().includes("already") ||
      signUpError.message?.toLowerCase().includes("exists")
    ) {
      return { success: false, error: "Ya existe una cuenta con este email." };
    }
    return {
      success: false,
      error: signUpError.message ?? "Error al crear la cuenta.",
    };
  }

  const requiresVerification =
    (signUpData as Record<string, unknown> | null)?.requireEmailVerification ===
    true;

  const newUserId = extractUserIdFromSignUpResponse(signUpData);

  /* Sin id en la respuesta (p. ej. solo envío de OTP): perfil tras verifyEmail o primer login. */
  if (requiresVerification && !newUserId) {
    return { success: true };
  }

  if (!newUserId) {
    return { success: false, error: "No se pudo completar el registro." };
  }

  const raw = signUpData as Record<string, unknown> | null | undefined;
  const accessToken =
    typeof raw?.accessToken === "string" ? raw.accessToken : undefined;

  /* RLS exige JWT del usuario para insertar su fila; si no hay token aún, verifyEmail / login / trigger DB. */
  if (!accessToken) {
    return { success: true };
  }

  const authedClient = createInsForgeServerClient(accessToken);
  const { error: profileErr } = await upsertStaffPendingProfile(
    authedClient,
    newUserId,
  );

  if (profileErr) {
    return {
      success: false,
      error: profileErr ?? "Error al registrar la solicitud.",
    };
  }

  return { success: true };
}
