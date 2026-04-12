"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "./auth-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function UserMenu() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  if (loading) {
    return <Skeleton className="h-9 w-24 rounded-lg" />;
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
      <Avatar size="default">
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="hidden sm:block">
        <p className="text-sm font-medium">{user.name ?? user.email}</p>
        {user.name && (
          <p className="text-xs text-muted-foreground">{user.email}</p>
        )}
      </div>
      <Button variant="ghost" size="sm" onClick={handleSignOut} className="ml-1">
        Salir
      </Button>
    </div>
  );
}
