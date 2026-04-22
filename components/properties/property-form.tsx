"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconLoader2, IconDroplet, IconBolt, IconWifi } from "@tabler/icons-react";
import { propertySchema, type PropertyFormValues } from "@/lib/validations";
import type { Property, CreatePropertyInput, Direccion, PropertyPhoto } from "@/types";
import { PropertyPhotos } from "./property-photos";

function formatDireccionCompleta(d: Direccion): string {
  let text = `${d.calle} ${d.numero_exterior}`;
  if (d.numero_interior) text += ` Int. ${d.numero_interior}`;
  text += `, ${d.colonia}, ${d.ciudad}, ${d.estado}`;
  if (d.cp) text += ` C.P. ${d.cp}`;
  return text;
}

interface PropertyFormProps {
  property?: Property;
  direcciones?: Direccion[];
  onSubmit: (data: CreatePropertyInput) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
}

export function PropertyForm({ property, direcciones, onSubmit, onCancel }: PropertyFormProps) {
  const [photos, setPhotos] = useState<PropertyPhoto[]>(property?.fotos ?? []);
  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      nombre: property?.nombre ?? "",
      direccion: property?.direccion ?? "",
      direccion_id: property?.direccion_id ?? null,
      descripcion: property?.descripcion ?? "",
      disponible: property?.disponible ?? true,
      contrato_agua: property?.contrato_agua ?? "",
      contrato_luz: property?.contrato_luz ?? "",
      contrato_internet: property?.contrato_internet ?? "",
    },
    mode: "onBlur",
  });

  const { isSubmitting, errors } = form.formState;

  function handleDireccionSelect(value: string) {
    if (value === "__none__") {
      form.setValue("direccion_id", null);
      return;
    }
    form.setValue("direccion_id", value);
    const selected = direcciones?.find((d) => d.id === value);
    if (selected) {
      form.setValue("direccion", formatDireccionCompleta(selected));
    }
  }

  async function handleSubmit(values: PropertyFormValues) {
    const data: CreatePropertyInput = {
      nombre: values.nombre.trim(),
      direccion: values.direccion.trim(),
      direccion_id: values.direccion_id || null,
      descripcion: values.descripcion?.trim() || undefined,
      disponible: values.disponible,
      contrato_agua: values.contrato_agua?.trim() || undefined,
      contrato_luz: values.contrato_luz?.trim() || undefined,
      contrato_internet: values.contrato_internet?.trim() || undefined,
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

        {direcciones && direcciones.length > 0 && (
          <FormField
            control={form.control}
            name="direccion_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dirección del edificio (opcional)</FormLabel>
                <Select
                  value={field.value ?? "__none__"}
                  onValueChange={handleDireccionSelect}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sin asignar" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="__none__">Sin asignar</SelectItem>
                    {direcciones.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

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

        <div className="space-y-3">
          <p className="text-sm font-medium leading-none">
            Contratos de servicios
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
              (opcional)
            </span>
          </p>

          <FormField
            control={form.control}
            name="contrato_agua"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5 font-normal">
                  <IconDroplet className="size-3.5 text-blue-500" />
                  Agua
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej: 123456789"
                    disabled={isSubmitting}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="contrato_luz"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5 font-normal">
                    <IconBolt className="size-3.5 text-yellow-500" />
                    Luz
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: RPU-001234"
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
              name="contrato_internet"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5 font-normal">
                    <IconWifi className="size-3.5 text-violet-500" />
                    Internet
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: CLI-789012"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {property ? (
          <PropertyPhotos
            propertyId={property.id}
            photos={photos}
            onPhotosChange={setPhotos}
          />
        ) : (
          <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            Podrás agregar fotos después de crear la propiedad.
          </p>
        )}

        {!property && (
          <FormField
            control={form.control}
            name="disponible"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-0.5">
                  <FormLabel>Disponible</FormLabel>
                  <FormDescription>
                    Indica si la propiedad está disponible para renta
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    className="shrink-0"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSubmitting}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}

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
