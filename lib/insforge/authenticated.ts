import { getAccessToken } from "@/lib/auth/cookies";
import { createInsForgeServerClient } from "@/lib/insforge/server";

export async function getAuthenticatedClient() {
  const accessToken = await getAccessToken();
  if (!accessToken) throw new Error("No autenticado");
  return createInsForgeServerClient(accessToken);
}

export async function getAuthenticatedClientWithUser() {
  const client = await getAuthenticatedClient();
  const { data, error } = await client.auth.getCurrentUser();
  if (error || !data?.user) throw new Error("No se pudo obtener el usuario");
  const user = data.user as { id: string };
  return { client, userId: user.id };
}
