"use server";

import { createInsForgeServerClient } from "@/lib/insforge/server";
import { extractUserIdFromSignUpResponse } from "@/lib/auth/services";
import { requireAdmin } from "@/lib/auth/authorization";
import type { ActionResult } from "@/types";
import type { UserRole } from "@/lib/auth/types";

export interface AppUser {
  id: string;
  user_id: string;
  email: string;
  name: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

/** Acepta array PostgREST o respuestas envueltas por el proxy (p. ej. { data: [...] }). */
function normalizeProfileListPayload(data: unknown): Record<string, unknown>[] {
  if (data == null) return [];
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (typeof data === "object") {
    const o = data as Record<string, unknown>;
    for (const key of ["data", "rows", "result"] as const) {
      const inner = o[key];
      if (Array.isArray(inner)) return inner as Record<string, unknown>[];
    }
  }
  return [data as Record<string, unknown>];
}

function readIsActiveField(p: Record<string, unknown>): unknown {
  if (Object.prototype.hasOwnProperty.call(p, "is_active")) return p.is_active;
  if (Object.prototype.hasOwnProperty.call(p, "isActive")) return p.isActive;
  return undefined;
}

/** PostgREST / proxies a veces devuelven boolean como string o número. */
function coalesceIsActive(v: unknown): boolean {
  if (v === true || v === 1) return true;
  if (v === false || v === 0) return false;
  if (typeof v === "string") {
    const s = v.toLowerCase().trim();
    if (s === "true" || s === "t" || s === "1") return true;
    if (s === "false" || s === "f" || s === "0") return false;
  }
  return false;
}

function profileRowToAppUser(p: Record<string, unknown>): AppUser {
  const email =
    typeof p.email === "string" && p.email.length > 0 ? p.email : "";
  const name =
    typeof p.name === "string" && p.name.length > 0 ? p.name : null;
  return {
    id: String(p.id),
    user_id: String(p.user_id ?? p.userId),
    email,
    name,
    role: p.role as UserRole,
    is_active: coalesceIsActive(readIsActiveField(p)),
    created_at: String(p.created_at ?? p.createdAt),
  };
}

export async function getUsers(): Promise<ActionResult<AppUser[]>> {
  try {
    const { client } = await requireAdmin();

    // Email/nombre viven en auth.users; user_profiles no los tiene. RPC une ambas tablas.
    const { data: withIdentity, error: identityError } =
      await client.database.rpc("admin_list_app_users");

    if (!identityError && withIdentity != null) {
      const rows = normalizeProfileListPayload(withIdentity);
      return {
        success: true,
        data: rows.map(profileRowToAppUser),
      };
    }

    // Sin admin_list_app_users (SQL antiguo): mismo listado sin email.
    const { data: tableData, error: tableError } = await client.database
      .from("user_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    let rows: Record<string, unknown>[] = [];

    if (!tableError) {
      rows = normalizeProfileListPayload(tableData);
    } else {
      const { data: rpcData, error: rpcError } = await client.database.rpc(
        "admin_list_user_profiles",
      );

      if (rpcError) {
        const rpcMsg = rpcError.message ?? "Error al obtener usuarios.";
        const tableMsg = tableError.message ?? "";
        const code = String((rpcError as { code?: string }).code ?? "");
        const combined = `${rpcMsg} ${tableMsg} ${code}`;
        const needSqlSetup =
          /recursion|42P17|does not exist|42883|admin_list|schema cache|could not find the function/i.test(
            combined,
          );
        if (needSqlSetup) {
          return {
            success: false,
            error:
              "Aplica el SQL de InsForge una vez desde la raíz del repo: npm run db:fix-user-profiles-rls (antes: npx @insforge/cli link si no enlazaste el proyecto). " +
              "Eso define admin_list_app_users, admin_list_user_profiles y las políticas RLS de user_profiles. " +
              `Detalle consulta: ${tableMsg || "—"}. Detalle RPC: ${rpcMsg}`,
          };
        }
        return {
          success: false,
          error: tableMsg ? `${tableMsg} | ${rpcMsg}` : rpcMsg,
        };
      }

      rows = normalizeProfileListPayload(rpcData);
    }

    return { success: true, data: rows.map(profileRowToAppUser) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error de conexión.";
    return { success: false, error: msg };
  }
}

/** Cuentas con perfil creado e inactivas (solicitud de acceso). Consulta directa a `user_profiles` + datos de identidad vía RPC. */
export async function listPendingAccessUsers(): Promise<ActionResult<AppUser[]>> {
  try {
    const { client } = await requireAdmin();

    let { data: pendingRows, error: pendingErr } = await client.database
      .from("user_profiles")
      .select("*")
      .or("is_active.eq.false,is_active.is.null")
      .order("created_at", { ascending: false });

    if (pendingErr) {
      const fallback = await client.database
        .from("user_profiles")
        .select("*")
        .eq("is_active", false)
        .order("created_at", { ascending: false });
      pendingRows = fallback.data;
      pendingErr = fallback.error;
    }

    if (pendingErr) {
      return {
        success: false,
        error: pendingErr.message ?? "No se pudieron cargar las solicitudes.",
      };
    }

    const pending = normalizeProfileListPayload(pendingRows);
    if (pending.length === 0) {
      return { success: true, data: [] };
    }

    const identityByProfileId = new Map<string, Record<string, unknown>>();
    const { data: identityData, error: idErr } =
      await client.database.rpc("admin_list_app_users");
    if (!idErr && identityData != null) {
      for (const row of normalizeProfileListPayload(identityData)) {
        identityByProfileId.set(String(row.id), row);
      }
    }

    const merged: AppUser[] = pending.map((p) => {
      const id = String(p.id);
      const extra = identityByProfileId.get(id);
      /* La fila de tabla manda en is_active; el RPC aporta email/nombre. */
      const combined = extra ? { ...extra, ...p } : p;
      return profileRowToAppUser(combined);
    });

    return {
      success: true,
      data: merged.filter((u) => !u.is_active),
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error de conexión.";
    return { success: false, error: msg };
  }
}

/** Activa la cuenta de un usuario pendiente (solo administradores). */
export async function approvePendingUser(
  profileId: string,
): Promise<ActionResult> {
  try {
    const { client } = await requireAdmin();
    const { data, error: selErr } = await client.database
      .from("user_profiles")
      .select("id, is_active")
      .eq("id", profileId)
      .maybeSingle();

    if (selErr) {
      return {
        success: false,
        error: selErr.message ?? "Error al comprobar el perfil.",
      };
    }

    const row = data as { is_active?: boolean } | null;
    if (!row) {
      return { success: false, error: "No se encontró el perfil." };
    }
    if (row.is_active === true) {
      return { success: true };
    }

    const { error } = await client.database
      .from("user_profiles")
      .update({ is_active: true })
      .eq("id", profileId);

    if (error) {
      return {
        success: false,
        error: error.message ?? "Error al activar la cuenta.",
      };
    }
    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error de conexión.";
    return { success: false, error: msg };
  }
}

export async function createUser(
  input: CreateUserInput,
): Promise<ActionResult<AppUser>> {
  if (!input.name?.trim())
    return { success: false, error: "El nombre es requerido." };
  if (!input.email?.trim())
    return { success: false, error: "El email es requerido." };
  if (!input.password || input.password.length < 8)
    return {
      success: false,
      error: "La contraseña debe tener al menos 8 caracteres.",
    };
  if (!["admin", "staff"].includes(input.role))
    return { success: false, error: "Rol inválido." };

  try {
    const { client } = await requireAdmin();

    const insforge = createInsForgeServerClient();
    const { data: signUpData, error: signUpError } = await insforge.auth.signUp(
      {
        email: input.email.trim(),
        password: input.password,
        name: input.name.trim(),
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/verify-email`,
      },
    );

    if (signUpError) {
      if (
        signUpError.message?.toLowerCase().includes("already") ||
        signUpError.message?.toLowerCase().includes("exists")
      ) {
        return {
          success: false,
          error: "Ya existe una cuenta con este email.",
        };
      }
      return {
        success: false,
        error: signUpError.message ?? "Error al crear el usuario.",
      };
    }

    const newUserId = extractUserIdFromSignUpResponse(signUpData);
    if (!newUserId) {
      return {
        success: false,
        error: "No se pudo obtener el ID del nuevo usuario.",
      };
    }

    const { data: profile, error: profileError } = await client.database
      .from("user_profiles")
      .upsert(
        {
          user_id: newUserId,
          role: input.role,
          is_active: true,
        },
        { onConflict: "user_id" },
      )
      .select();

    if (profileError) {
      return {
        success: false,
        error: profileError.message ?? "Error al asignar rol.",
      };
    }

    const p = (profile as Record<string, unknown>[])?.[0];
    return {
      success: true,
      data: {
        id: p?.id as string,
        user_id: newUserId,
        email: input.email.trim(),
        name: input.name.trim(),
        role: input.role,
        is_active: true,
        created_at: p?.created_at as string,
      },
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error de conexión.";
    return { success: false, error: msg };
  }
}

export async function updateUserRole(
  profileId: string,
  role: UserRole,
): Promise<ActionResult> {
  if (!["admin", "staff"].includes(role))
    return { success: false, error: "Rol inválido." };

  try {
    const { client, userId: adminUserId } = await requireAdmin();

    const { data: targetRow, error: fetchErr } = await client.database
      .from("user_profiles")
      .select("user_id")
      .eq("id", profileId)
      .maybeSingle();

    if (fetchErr) {
      return {
        success: false,
        error: fetchErr.message ?? "No se pudo verificar el usuario.",
      };
    }
    const targetUserId = (targetRow as { user_id?: string } | null)?.user_id;
    if (!targetUserId) {
      return { success: false, error: "No se encontró el perfil." };
    }
    if (targetUserId === adminUserId && role === "staff") {
      return {
        success: false,
        error: "No puedes quitarte el rol de administrador.",
      };
    }

    const { error } = await client.database
      .from("user_profiles")
      .update({ role })
      .eq("id", profileId);

    if (error)
      return {
        success: false,
        error: error.message ?? "Error al actualizar rol.",
      };
    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error de conexión.";
    return { success: false, error: msg };
  }
}

export async function toggleUserActive(
  profileId: string,
  isActive: boolean,
): Promise<ActionResult> {
  try {
    const { client } = await requireAdmin();
    const { error } = await client.database
      .from("user_profiles")
      .update({ is_active: isActive })
      .eq("id", profileId);

    if (error)
      return {
        success: false,
        error: error.message ?? "Error al cambiar estado.",
      };
    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error de conexión.";
    return { success: false, error: msg };
  }
}

export async function deleteUser(profileId: string): Promise<ActionResult> {
  try {
    const { client } = await requireAdmin();
    const { error } = await client.database
      .from("user_profiles")
      .delete()
      .eq("id", profileId);

    if (error)
      return {
        success: false,
        error: error.message ?? "Error al eliminar usuario.",
      };
    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error de conexión.";
    return { success: false, error: msg };
  }
}
