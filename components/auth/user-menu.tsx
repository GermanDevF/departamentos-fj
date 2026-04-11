"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "./auth-provider";

export function UserMenu() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="h-9 w-24 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-700" />
    );
  }

  if (!user) return null;

  async function handleSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = (user.name ?? user.email)
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
        {initials}
      </div>
      <div className="hidden sm:block">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {user.name ?? user.email}
        </p>
        {user.name && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {user.email}
          </p>
        )}
      </div>
      <button
        onClick={handleSignOut}
        className="ml-2 rounded-lg px-3 py-1.5 text-sm text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
      >
        Salir
      </button>
    </div>
  );
}
