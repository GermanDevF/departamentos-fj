"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "@/lib/auth/actions";
import { IconLoader2, IconClock, IconEye, IconEyeOff } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { loginSchema, type LoginFormValues } from "@/lib/validations";
import { RequestAccountDialog } from "./request-account-dialog";
import type { AuthErrorCode } from "@/lib/auth/types";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";
  const [isPending, startTransition] = useTransition();
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [lastErrorCode, setLastErrorCode] = useState<AuthErrorCode | undefined>();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onBlur",
  });

  const { errors } = form.formState;

  function handleSubmit(values: LoginFormValues) {
    const formData = new FormData();
    formData.set("email", values.email);
    formData.set("password", values.password);

    startTransition(async () => {
      const result = await signIn(formData);
      if (result.success) {
        router.push(redirect);
        router.refresh();
      } else {
        setLastErrorCode(result.code);
        form.setError("root", {
          message: result.error ?? "Error al iniciar sesión.",
        });
      }
    });
  }

  const loading = isPending;
  const isPendingApproval = lastErrorCode === "pending_approval";

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
          {isPendingApproval && errors.root ? (
            <Alert className="border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400">
              <IconClock className="size-4" />
              <AlertDescription>{errors.root.message}</AlertDescription>
            </Alert>
          ) : (
            errors.root && (
              <Alert variant="destructive">
                <AlertDescription>{errors.root.message}</AlertDescription>
              </Alert>
            )
          )}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correo electrónico</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="tu@email.com"
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      disabled={loading}
                      className="pr-10"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      disabled={loading}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors disabled:pointer-events-none"
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPassword ? (
                        <IconEyeOff className="size-4" />
                      ) : (
                        <IconEye className="size-4" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={loading} className="w-full" size="lg">
            {loading ? (
              <>
                <IconLoader2 className="animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              "Iniciar sesión"
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <button
              type="button"
              className="font-medium text-primary underline-offset-4 hover:underline"
              onClick={() => setRequestDialogOpen(true)}
            >
              Solicitar acceso
            </button>
          </p>
        </form>
      </Form>

      <RequestAccountDialog
        open={requestDialogOpen}
        onOpenChange={setRequestDialogOpen}
        defaultEmail={form.getValues("email")}
      />
    </>
  );
}
