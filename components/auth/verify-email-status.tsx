"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { resendVerificationEmail } from "@/lib/auth/actions";
import {
  IconLoader2,
  IconCircleCheck,
  IconCircleX,
  IconMail,
} from "@tabler/icons-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Tras hacer clic en el enlace del correo, InsForge redirige aquí con estos params. */
function readInsForgeVerifyEmailRedirect(searchParams: URLSearchParams): {
  kind: "success" | "error" | null;
  message?: string;
} {
  const status = searchParams.get("insforge_status");
  const type = searchParams.get("insforge_type");
  if (type !== "verify_email") return { kind: null };
  if (status === "success") return { kind: "success" };
  if (status === "error") {
    const raw = searchParams.get("insforge_error") ?? "";
    try {
      return {
        kind: "error",
        message:
          decodeURIComponent(raw) || "No se pudo verificar el correo.",
      };
    } catch {
      return { kind: "error", message: raw || "No se pudo verificar el correo." };
    }
  }
  return { kind: null };
}

export function VerifyEmailStatus() {
  const searchParams = useSearchParams();
  const linkRedirect = readInsForgeVerifyEmailRedirect(searchParams);

  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");
  const [resendMsg, setResendMsg] = useState("");

  function handleResend() {
    if (!email.trim()) {
      setErrorMsg("Ingresa tu email para reenviar el correo.");
      return;
    }
    setResendMsg("");
    setErrorMsg("");

    startTransition(async () => {
      const result = await resendVerificationEmail(email);
      if (result.success) {
        setResendMsg("Se envió un nuevo correo de verificación.");
      } else {
        setErrorMsg(result.error ?? "No se pudo reenviar el correo.");
      }
    });
  }

  if (linkRedirect.kind === "success") {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <IconCircleCheck className="size-10 text-green-600 dark:text-green-400" />
        <div className="space-y-1">
          <p className="font-medium text-zinc-900 dark:text-zinc-50">
            Email verificado correctamente
          </p>
          <p className="text-sm text-muted-foreground">
            El enlace del correo fue válido. Inicia sesión con tu email y
            contraseña para continuar.
          </p>
        </div>
        <Button asChild className="mt-2 w-full">
          <Link href="/login">Iniciar sesión</Link>
        </Button>
      </div>
    );
  }

  if (linkRedirect.kind === "error") {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <IconCircleX className="size-10 text-destructive" />
        <Alert variant="destructive" className="w-full text-left">
          <AlertDescription>
            {linkRedirect.message ?? "No se pudo verificar el correo."}
          </AlertDescription>
        </Alert>
        <p className="text-sm text-muted-foreground">
          Solicita un nuevo correo desde el registro o contacta soporte si el
          problema continúa.
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link href="/login">Volver al inicio de sesión</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 py-4">
      <IconMail className="size-10 text-primary" />
      <p className="text-sm text-muted-foreground text-center">
        Te enviamos un correo con un enlace para verificar tu cuenta. Ábrelo y
        confirma tu email; luego podrás iniciar sesión.
      </p>

      {errorMsg && (
        <Alert variant="destructive" className="w-full">
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      )}

      {resendMsg && (
        <Alert className="w-full border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400">
          <AlertDescription>{resendMsg}</AlertDescription>
        </Alert>
      )}

      <div className="w-full space-y-1.5">
        <label
          htmlFor="verify-email"
          className="text-sm font-medium text-zinc-900 dark:text-zinc-50"
        >
          Correo electrónico
        </label>
        <Input
          id="verify-email"
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isPending}
          autoComplete="email"
        />
      </div>

      <Button
        type="button"
        disabled={isPending}
        className="w-full"
        size="lg"
        onClick={handleResend}
      >
        {isPending ? (
          <>
            <IconLoader2 className="animate-spin" />
            Enviando...
          </>
        ) : (
          "Reenviar correo de verificación"
        )}
      </Button>

      <Link
        href="/login"
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        Volver al inicio de sesión
      </Link>
    </div>
  );
}
