"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { direccionSchema, type DireccionFormValues } from "@/lib/validations";
import type { Direccion, CreateDireccionInput } from "@/types";

interface DireccionFormProps {
  direccion?: Direccion;
  onSubmit: (data: CreateDireccionInput) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
}

export function DireccionForm({ direccion, onSubmit, onCancel }: DireccionFormProps) {
  const form = useForm<DireccionFormValues>({
    resolver: zodResolver(direccionSchema),
    defaultValues: {
      nombre: direccion?.nombre ?? "",
      calle: direccion?.calle ?? "",
      numero_exterior: direccion?.numero_exterior ?? "",
      numero_interior: direccion?.numero_interior ?? "",
      colonia: direccion?.colonia ?? "",
      ciudad: direccion?.ciudad ?? "",
      estado: direccion?.estado ?? "",
      cp: direccion?.cp ?? "",
      notas: direccion?.notas ?? "",
    },
    mode: "onBlur",
  });

  const { isSubmitting, errors } = form.formState;

  async function handleSubmit(values: DireccionFormValues) {
    const data: CreateDireccionInput = {
      nombre: values.nombre.trim(),
      calle: values.calle.trim(),
      numero_exterior: values.numero_exterior.trim(),
      numero_interior: values.numero_interior?.trim() || undefined,
      colonia: values.colonia.trim(),
      ciudad: values.ciudad.trim(),
      estado: values.estado.trim(),
      cp: values.cp?.trim() || undefined,
      notas: values.notas?.trim() || undefined,
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
              <FormLabel>Nombre / Etiqueta</FormLabel>
              <FormControl>
                <Input
                  placeholder='Ej: Edificio Calle 5 #23'
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="calle"
            render={({ field }) => (
              <FormItem className="sm:col-span-1">
                <FormLabel>Calle</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Av. Principal" disabled={isSubmitting} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="numero_exterior"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Núm. exterior</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: 123" disabled={isSubmitting} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="numero_interior"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Núm. interior (opc.)</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: 4-A" disabled={isSubmitting} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="colonia"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Colonia</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Centro" disabled={isSubmitting} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ciudad"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ciudad</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Guadalajara" disabled={isSubmitting} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="estado"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Jalisco" disabled={isSubmitting} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>C.P. (opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: 44100" disabled={isSubmitting} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notas"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Observaciones sobre la ubicación..."
                  rows={3}
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
            ) : direccion ? (
              "Actualizar"
            ) : (
              "Crear dirección"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
