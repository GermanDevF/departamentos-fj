import { createClient } from "@insforge/sdk";

let browserClient: ReturnType<typeof createClient> | null = null;

export function getInsForgeBrowserClient() {
  if (browserClient) return browserClient;

  browserClient = createClient({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
    anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
  });

  return browserClient;
}
