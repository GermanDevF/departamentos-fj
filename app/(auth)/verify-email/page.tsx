import { Suspense } from "react";
import { VerifyEmailStatus } from "@/components/auth/verify-email-status";
import { IconLoader2 } from "@tabler/icons-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verificar email - Departamentos FJ",
};

export default function VerifyEmailPage() {
  return (
    <>
      <h1 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50 text-center">
        Verificación de email
      </h1>
      <Suspense
        fallback={
          <div className="flex flex-col items-center gap-4 py-6">
            <IconLoader2 className="size-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Cargando...</p>
          </div>
        }
      >
        <VerifyEmailStatus />
      </Suspense>
    </>
  );
}
