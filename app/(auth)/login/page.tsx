import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar sesión - Departamentos FJ",
};

export default function LoginPage() {
  return (
    <>
      <h1 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Iniciar sesión
      </h1>
      <Suspense>
        <LoginForm />
      </Suspense>
    </>
  );
}
