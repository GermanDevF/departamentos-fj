"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  useFormField,
} from "@/components/ui/form";
import { DatePicker } from "@/components/ui/date-picker";
import type { ControllerRenderProps } from "react-hook-form";
import { IconLoader2 } from "@tabler/icons-react";
import { contractSchema, type ContractFormValues } from "@/lib/validations";
import type { Property, Tenant, CreateContractInput, TipoDuracion } from "@/types";
import { TIPOS_DURACION } from "@/types";
import type { ContractRow } from "@/lib/contracts/actions";

interface ContractFormProps {
  contract?: ContractRow;
  properties: Property[];
  tenants: Tenant[];
  onSubmit: (data: CreateContractInput) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
}

function ContractFechaInicioPicker({
  field,
  disabled,
}: {
  field: ControllerRenderProps<ContractFormValues, "fecha_inicio">;
  disabled: boolean;
}) {
  const { formItemId, error, formDescriptionId, formMessageId } = useFormField();
  return (
    <DatePicker
      id={formItemId}
      aria-invalid={!!error}
      aria-describedby={
        !error ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`
      }
      value={field.value}
      onChange={field.onChange}
      onBlur={field.onBlur}
      disabled={disabled}
    />
  );
}

export function ContractForm({
  contract,
  properties,
  tenants,
  onSubmit,
  onCancel,
}: ContractFormProps) {
  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      propiedad_id: contract?.propiedad_id ?? "",
      inquilino_id: contract?.inquilino_id ?? "",
      fecha_inicio: contract?.fecha_inicio ?? "",
      tipo_duracion: contract?.tipo_duracion ?? "meses",
      duracion_cantidad: contract?.duracion_cantidad ?? null,
      precio_mensual: contract?.precio_mensual ?? (undefined as unknown as number),
      dia_pago: contract?.dia_pago ?? (undefined as unknown as number),
    },
    mode: "onBlur",
  });

  const { isSubmitting, errors } = form.formState;
  const tipoDuracion = useWatch({
    control: form.control,
    name: "tipo_duracion",
  });

  async function handleSubmit(values: ContractFormValues) {
    const data: CreateContractInput = {
      propiedad_id: values.propiedad_id,
      inquilino_id: values.inquilino_id,
      fecha_inicio: values.fecha_inicio,
      tipo_duracion: values.tipo_duracion,
      duracion_cantidad:
        values.tipo_duracion === "indefinido" ? null : values.duracion_cantidad,
      precio_mensual: values.precio_mensual,
      dia_pago: values.dia_pago,
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

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="propiedad_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Propiedad</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isSubmitting || !!contract}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona propiedad" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {properties
                      .filter((p) => p.disponible || p.id === contract?.propiedad_id)
                      .map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nombre}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="inquilino_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Inquilino</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isSubmitting || !!contract}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona inquilino" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {tenants.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="fecha_inicio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de inicio</FormLabel>
                <ContractFechaInicioPicker field={field} disabled={isSubmitting} />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tipo_duracion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de duración</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v as TipoDuracion);
                    if (v === "indefinido") {
                      form.setValue("duracion_cantidad", null);
                    }
                  }}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TIPOS_DURACION.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {tipoDuracion !== "indefinido" && (
          <FormField
            control={form.control}
            name="duracion_cantidad"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Cantidad ({TIPOS_DURACION.find((t) => t.value === tipoDuracion)?.label.toLowerCase()})
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    placeholder="Ej: 6"
                    disabled={isSubmitting}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      field.onChange(val === "" ? null : Number(val));
                    }}
                    onBlur={field.onBlur}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="precio_mensual"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio mensual ($)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min={0.01}
                    placeholder="Ej: 5000.00"
                    disabled={isSubmitting}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      field.onChange(val === "" ? undefined : Number(val));
                    }}
                    onBlur={field.onBlur}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dia_pago"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Día de pago (1-31)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    placeholder="Ej: 1"
                    disabled={isSubmitting}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      field.onChange(val === "" ? undefined : Number(val));
                    }}
                    onBlur={field.onBlur}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
            ) : contract ? (
              "Actualizar"
            ) : (
              "Crear contrato"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
