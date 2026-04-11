import { AuthProvider } from "@/components/auth/auth-provider";
import { UserMenu } from "@/components/auth/user-menu";
import Link from "next/link";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
        <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link
              href="/dashboard"
              className="text-lg font-bold text-zinc-900 dark:text-zinc-50"
            >
              Departamentos FJ
            </Link>
            <UserMenu />
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
