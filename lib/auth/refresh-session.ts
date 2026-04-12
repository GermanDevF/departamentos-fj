"use server";

import { createInsForgeServerClient } from "@/lib/insforge/server";
import { getRefreshToken, setAuthCookies } from "@/lib/auth/cookies";

export async function refreshSessionFromCookies(): Promise<boolean> {
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
