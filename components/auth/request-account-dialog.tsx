"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { requestAccount } from "@/lib/access-requests/actions";
import {
  requestAccountSchema,
  type RequestAccountFormValues,
} from "@/lib/validations";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { IconLoader2, IconCircleCheck } from "@tabler/icons-react";

interface RequestAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultEmail?: string;
}

export function RequestAccountDialog({
  open,
  onOpenChange,
  defaultEmail,
}: RequestAccountDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);

  const form = useForm<RequestAccountFormValues>({
    resolver: zodResolver(requestAccountSchema),
    defaultValues: {
      name: "",
      email: defaultEmail ?? "",
      password: "",
    },
    mode: "onBlur",
  });

  function handleSubmit(values: RequestAccountFormValues) {
    startTransition(async () => {
      const result = await requestAccount(values);
      if (result.success) {
        setSuccess(true);
        form.reset();
      } else {
        form.setError("root", {
          message: result.error ?? "Error al enviar la solicitud.",
        });
      }
    });
  }

  function handleOpenChange(value: boolean) {
    if (!value) {
      setSuccess(false);
      form.reset();
      form.clearErrors();
    }
    onOpenChange(value);
  }

  const { errors } = form.formState;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Solicitar acceso</DialogTitle>
          <DialogDescription>
            Completa tus datos para solicitar una cuenta. Un administrador
            revisará tu solicitud.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10">
              <IconCircleCheck className="size-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">Solicitud enviada</p>
              <p className="text-sm text-muted-foreground">
                Tu cuenta ha sido creada y está pendiente de aprobación por un
                administrador. Recibirás acceso cuando sea aprobada.
              </p>
            </div>
            <Button
              variant="outline"
              className="mt-2"
              onClick={() => handleOpenChange(false)}
            >
              Entendido
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              {errors.root && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.root.message}</AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre completo</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Tu nombre"
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo electrónico</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="tu@email.com"
                        disabled={isPending}
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
                      <Input
                        type="password"
                        placeholder="Mínimo 8 caracteres"
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={isPending}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <>
                      <IconLoader2 className="animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Solicitar cuenta"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
