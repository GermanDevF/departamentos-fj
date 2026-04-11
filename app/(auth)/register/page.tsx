import { RegisterForm } from "@/components/auth/register-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crear cuenta - Departamentos FJ",
};

export default function RegisterPage() {
  return (
    <>
      <h1 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Crear cuenta
      </h1>
      <RegisterForm />
    </>
  );
}
