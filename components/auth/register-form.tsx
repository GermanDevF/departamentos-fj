"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signUp, verifyEmail, resendVerification } from "@/lib/auth/actions";
import Link from "next/link";

type Step = "register" | "verify";

export function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("register");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setEmail(String(formData.get("email") ?? "").trim());

    startTransition(async () => {
      const result = await signUp(formData);
      if (!result.success) {
        setError(result.error ?? "Error al crear la cuenta.");
        return;
      }

      if (result.requireEmailVerification) {
        if (result.verifyEmailMethod === "link") {
          setSuccess(
            "Cuenta creada. Revisa tu email y haz clic en el enlace de verificación.",
          );
        } else {
          setStep("verify");
        }
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    });
  }

  function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    const otp = String(formData.get("otp") ?? "").trim();

    if (otp.length !== 6) {
      setError("El código debe tener 6 dígitos.");
      return;
    }

    startTransition(async () => {
      const result = await verifyEmail(email, otp);
      if (result.success) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(result.error ?? "Código inválido.");
      }
    });
  }

  function handleResend() {
    setError("");
    startTransition(async () => {
      const result = await resendVerification(email);
      if (result.success) {
        setSuccess("Email de verificación reenviado.");
        setTimeout(() => setSuccess(""), 4000);
      } else {
        setError(result.error ?? "No se pudo reenviar.");
      }
    });
  }

  if (success && step === "register") {
    return (
      <div className="space-y-4 text-center">
        <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-400">
          {success}
        </div>
        <Link
          href="/login"
          className="inline-block text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
        >
          Ir a iniciar sesión
        </Link>
      </div>
    );
  }

  if (step === "verify") {
    return (
      <form onSubmit={handleVerify} className="space-y-5">
        <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          Enviamos un código de 6 dígitos a <strong>{email}</strong>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-400">
            {success}
          </div>
        )}

        <div>
          <label
            htmlFor="otp"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Código de verificación
          </label>
          <input
            id="otp"
            name="otp"
            type="text"
            inputMode="numeric"
            maxLength={6}
            pattern="[0-9]{6}"
            required
            disabled={isPending}
            placeholder="123456"
            className="block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-center text-lg tracking-widest text-zinc-900 placeholder-zinc-400 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-blue-400"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Verificando..." : "Verificar email"}
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={isPending}
          className="w-full text-center text-sm text-zinc-500 hover:text-zinc-700 disabled:opacity-50 dark:text-zinc-400 dark:hover:text-zinc-300"
        >
          Reenviar código
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleRegister} className="space-y-5">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="name"
          className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Nombre completo
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          disabled={isPending}
          placeholder="Juan Pérez"
          className="block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-zinc-900 placeholder-zinc-400 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-blue-400"
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Correo electrónico
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={isPending}
          placeholder="tu@email.com"
          className="block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-zinc-900 placeholder-zinc-400 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-blue-400"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          disabled={isPending}
          placeholder="Mínimo 8 caracteres"
          className="block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-zinc-900 placeholder-zinc-400 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-blue-400"
        />
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Confirmar contraseña
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          disabled={isPending}
          placeholder="Repite tu contraseña"
          className="block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-zinc-900 placeholder-zinc-400 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-blue-400"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:ring-2 focus:ring-blue-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? (
          <span className="flex items-center gap-2">
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Creando cuenta...
          </span>
        ) : (
          "Crear cuenta"
        )}
      </button>

      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/login"
          className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
        >
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
