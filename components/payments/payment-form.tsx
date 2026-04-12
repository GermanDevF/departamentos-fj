"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ContractRow } from "@/lib/contracts/actions";
import type { PaymentRow } from "@/lib/payments/actions";
import { paymentSchema, type PaymentFormValues } from "@/lib/validations";
import type { CreatePaymentInput } from "@/types";
import { METODOS_PAGO } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconLoader2 } from "@tabler/icons-react";
import { useEffect } from "react";
import {
  useForm,
  useWatch,
  type ControllerRenderProps
} from "react-hook-form";

const MESES = [
  { value: 1, label: "Enero" },
  { value: 2, label: "Febrero" },
  { value: 3, label: "Marzo" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Mayo" },
  { value: 6, label: "Junio" },
  { value: 7, label: "Julio" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Septiembre" },
  { value: 10, label: "Octubre" },
  { value: 11, label: "Noviembre" },
  { value: 12, label: "Diciembre" },
];

interface PaymentFormProps {
  payment?: PaymentRow;
  contracts: ContractRow[];
  onSubmit: (data: CreatePaymentInput) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
}

function PaymentFechaPagoPicker({
  field,
  disabled,
}: {
  field: ControllerRenderProps<PaymentFormValues, "fecha_pago">;
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
      placeholder="Selecciona la fecha de pago"
    />
  );
}

export function PaymentForm({
  payment,
  contracts,
  onSubmit,
  onCancel,
}: PaymentFormProps) {
  const now = new Date();
  const activeContracts = contracts.filter((c) => c.activo);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      contrato_id: payment?.contrato_id ?? "",
      monto: payment?.monto ?? (undefined as unknown as number),
      fecha_pago: payment?.fecha_pago ?? now.toISOString().split("T")[ 0 ],
      periodo_mes: payment?.periodo_mes ?? now.getMonth() + 1,
      periodo_anio: payment?.periodo_anio ?? now.getFullYear(),
      metodo_pago: payment?.metodo_pago ?? "efectivo",
      notas: payment?.notas ?? "",
    },
    mode: "onBlur",
  });

  const { isSubmitting, errors } = form.formState;
  const contratoId = useWatch({ control: form.control, name: "contrato_id" });

  useEffect(() => {
    if (contratoId && !payment) {
      const selected = activeContracts.find((c) => c.id === contratoId);
      if (selected) {
        form.setValue("monto", selected.precio_mensual);
      }
    }
  }, [ contratoId, activeContracts, payment, form ]);

  function contractLabel(c: ContractRow) {
    const prop = c.properties?.nombre ?? "Propiedad";
    const tenant = c.tenants?.nombre ?? "Inquilino";
    const price = new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(c.precio_mensual);
    return `${prop} — ${tenant} (${price}/mes)`;
  }

  async function handleSubmit(values: PaymentFormValues) {
    const data: CreatePaymentInput = {
      contrato_id: values.contrato_id,
      monto: values.monto,
      fecha_pago: values.fecha_pago,
      periodo_mes: values.periodo_mes,
      periodo_anio: values.periodo_anio,
      metodo_pago: values.metodo_pago,
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
          name="contrato_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contrato</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={isSubmitting || !!payment}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona un contrato activo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {activeContracts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {contractLabel(c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="monto"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monto</FormLabel>
                <div className="flex overflow-hidden rounded-lg border border-input bg-transparent transition-colors focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 dark:bg-input/30">
                  <FormControl>
                    <MoneyInput
                      className="min-w-0 flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent"
                      disabled={isSubmitting}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fecha_pago"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de pago</FormLabel>
                <PaymentFechaPagoPicker field={field} disabled={isSubmitting} />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField
            control={form.control}
            name="periodo_mes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mes del periodo</FormLabel>
                <Select
                  value={String(field.value)}
                  onValueChange={(v) => field.onChange(Number(v))}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {MESES.map((m) => (
                      <SelectItem key={m.value} value={String(m.value)}>
                        {m.label}
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
            name="periodo_anio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Año del periodo</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={2020}
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
            name="metodo_pago"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Método de pago</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {METODOS_PAGO.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  placeholder="Observaciones sobre el pago..."
                  rows={2}
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
            ) : payment ? (
              "Actualizar"
            ) : (
              "Registrar pago"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
