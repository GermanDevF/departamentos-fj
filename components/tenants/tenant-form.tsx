"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { IconLoader2 } from "@tabler/icons-react";
import { tenantSchema, type TenantFormValues } from "@/lib/validations";
import type { Tenant, CreateTenantInput } from "@/types";

interface TenantFormProps {
  tenant?: Tenant;
  onSubmit: (data: CreateTenantInput) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
}

export function TenantForm({ tenant, onSubmit, onCancel }: TenantFormProps) {
  const form = useForm<TenantFormValues>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      nombre: tenant?.nombre ?? "",
      telefono: tenant?.telefono ?? "",
      email: tenant?.email ?? "",
    },
    mode: "onBlur",
  });

  const { isSubmitting, errors } = form.formState;

  async function handleSubmit(values: TenantFormValues) {
    const data: CreateTenantInput = {
      nombre: values.nombre.trim(),
      telefono: values.telefono.trim(),
      email: values.email?.trim() || undefined,
    };

    const result = await onSubmit(data);
    if (!result.success) {
      form.setError("root", { message: result.error ?? "Error al guardar." });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {errors.root && (
          <Alert variant="destructive">
            <AlertDescription>{errors.root.message}</AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre completo</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: Juan Pérez"
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="telefono"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teléfono</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="Ej: 55 1234 5678"
                  disabled={isSubmitting}
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
              <FormLabel>Email (opcional)</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="Ej: juan@email.com"
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <IconLoader2 className="animate-spin" />
                Guardando...
              </>
            ) : tenant ? (
              "Actualizar"
            ) : (
              "Crear inquilino"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
