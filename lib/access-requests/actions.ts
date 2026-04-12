"use server";

import { requestAccountCreation } from "@/lib/auth/services";
import { requireAdmin } from "@/lib/auth/authorization";
import type { ActionResult } from "@/types";

interface RequestAccountInput {
  name: string;
  email: string;
  password: string;
}

export async function requestAccount(
  input: RequestAccountInput,
): Promise<ActionResult> {
  if (!input.name?.trim()) {
    return { success: false, error: "El nombre es requerido." };
  }
  if (!input.email?.trim()) {
    return { success: false, error: "El email es requerido." };
  }
  if (!input.password || input.password.length < 8) {
    return {
      success: false,
      error: "La contraseña debe tener al menos 8 caracteres.",
    };
  }

  try {
    return await requestAccountCreation({
      name: input.name.trim(),
      email: input.email.trim(),
      password: input.password,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error de conexión.";
    return { success: false, error: msg };
  }
}

export async function getPendingRequestsCount(): Promise<number> {
  try {
    const { client } = await requireAdmin();

    const { data, error } = await client.database.rpc(
      "list_app_users_with_identity",
    );

    if (error || data == null) return 0;
    return typeof data === "number" ? data : Number(data);
  } catch {
    return 0;
  }
}
