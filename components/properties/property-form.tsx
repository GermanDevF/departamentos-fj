"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { IconLoader2 } from "@tabler/icons-react";
import { propertySchema, type PropertyFormValues } from "@/lib/validations";
import type { Property, CreatePropertyInput } from "@/types";

interface PropertyFormProps {
  property?: Property;
  onSubmit: (data: CreatePropertyInput) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
}

export function PropertyForm({ property, onSubmit, onCancel }: PropertyFormProps) {
  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      nombre: property?.nombre ?? "",
      direccion: property?.direccion ?? "",
      descripcion: property?.descripcion ?? "",
      disponible: property?.disponible ?? true,
    },
    mode: "onBlur",
  });

  const { isSubmitting, errors } = form.formState;

  async function handleSubmit(values: PropertyFormValues) {
    const data: CreatePropertyInput = {
      nombre: values.nombre.trim(),
      direccion: values.direccion.trim(),
      descripcion: values.descripcion?.trim() || undefined,
      disponible: values.disponible,
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
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: Departamento Centro"
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
          name="direccion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: Av. Principal #123"
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
          name="descripcion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Detalles adicionales de la propiedad..."
                  rows={3}
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
          name="disponible"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 space-y-0.5">
                <FormLabel>Disponible</FormLabel>
                <FormDescription>
                  {property && !property.disponible
                    ? "Tiene un contrato activo"
                    : "Indica si la propiedad está disponible para renta"}
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  className="shrink-0"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isSubmitting || (!!property && !property.disponible)}
                />
              </FormControl>
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
            ) : property ? (
              "Actualizar"
            ) : (
              "Crear propiedad"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
