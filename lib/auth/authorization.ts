"use server";

import { getAccessToken } from "@/lib/auth/cookies";
import { createInsForgeServerClient } from "@/lib/insforge/server";
import { checkUserActiveStatus } from "@/lib/auth/services";
import type { UserRole } from "@/lib/auth/types";

interface AuthenticatedUser {
  userId: string;
  role: UserRole;
  client: ReturnType<typeof createInsForgeServerClient>;
}

export async function getAuthenticatedUserWithRole(): Promise<AuthenticatedUser> {
  const accessToken = await getAccessToken();
  if (!accessToken) throw new Error("No autenticado");

  const client = createInsForgeServerClient(accessToken);
  const { data, error } = await client.auth.getCurrentUser();
  if (error || !data?.user) throw new Error("No se pudo obtener el usuario");

  const userId = (data.user as { id: string }).id;

  const profile = await checkUserActiveStatus(client, userId);

  if (!profile) {
    throw new Error("No se encontró un perfil asociado a esta cuenta.");
  }

  if (!profile.isActive) {
    throw new Error(
      "Tu cuenta está pendiente de aprobación por un administrador.",
    );
  }

  return { userId, role: profile.role as UserRole, client };
}

export async function requireAdmin(): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUserWithRole();
  if (user.role !== "admin") {
    throw new Error("Se requieren permisos de administrador.");
  }
  return user;
}

export async function requireAuth(): Promise<AuthenticatedUser> {
  return getAuthenticatedUserWithRole();
}
