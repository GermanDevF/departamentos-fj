import { z } from "zod";

export const direccionSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido").max(150, "Máximo 150 caracteres"),
  calle: z.string().min(1, "La calle es requerida").max(200, "Máximo 200 caracteres"),
  numero_exterior: z.string().min(1, "El número exterior es requerido").max(20, "Máximo 20 caracteres"),
  numero_interior: z.string().max(20, "Máximo 20 caracteres").optional().or(z.literal("")),
  colonia: z.string().min(1, "La colonia es requerida").max(100, "Máximo 100 caracteres"),
  ciudad: z.string().min(1, "La ciudad es requerida").max(100, "Máximo 100 caracteres"),
  estado: z.string().min(1, "El estado es requerido").max(100, "Máximo 100 caracteres"),
  cp: z.string().max(10, "Máximo 10 caracteres").optional().or(z.literal("")),
  notas: z.string().max(500, "Máximo 500 caracteres").optional().or(z.literal("")),
});

export type DireccionFormValues = z.infer<typeof direccionSchema>;

export const propertySchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido").max(100, "Máximo 100 caracteres"),
  direccion: z.string().min(1, "La dirección es requerida").max(200, "Máximo 200 caracteres"),
  direccion_id: z.string().uuid("ID de dirección inválido").nullable().optional(),
  descripcion: z.string().max(500, "Máximo 500 caracteres").optional().or(z.literal("")),
  disponible: z.boolean().default(true),
  contrato_agua: z.string().max(100, "Máximo 100 caracteres").optional().or(z.literal("")),
  contrato_luz: z.string().max(100, "Máximo 100 caracteres").optional().or(z.literal("")),
  contrato_internet: z.string().max(100, "Máximo 100 caracteres").optional().or(z.literal("")),
});

export type PropertyFormValues = z.infer<typeof propertySchema>;

export const tenantSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido").max(100, "Máximo 100 caracteres"),
  telefono: z.string().min(1, "El teléfono es requerido").max(20, "Máximo 20 caracteres"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
});

export type TenantFormValues = z.infer<typeof tenantSchema>;

export const contractSchema = z
  .object({
    propiedad_id: z.string().min(1, "Selecciona una propiedad"),
    inquilino_id: z.string().min(1, "Selecciona un inquilino"),
    fecha_inicio: z
      .string()
      .min(1, "La fecha de inicio es requerida")
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
    tipo_duracion: z.enum(["horas", "dias", "semanas", "meses", "indefinido"]),
    duracion_cantidad: z.coerce
      .number()
      .positive("Debe ser mayor a 0")
      .int("Debe ser un número entero")
      .nullable(),
    precio_mensual: z.coerce.number().positive("Debe ser mayor a $0"),
    moneda: z.enum(["MXN", "USD"]).default("MXN"),
    dia_pago: z.coerce.number().int().min(1, "Mínimo 1").max(31, "Máximo 31"),
  })
  .refine(
    (d) =>
      d.tipo_duracion === "indefinido" ||
      (d.duracion_cantidad !== null && d.duracion_cantidad > 0),
    { message: "La duración es requerida", path: ["duracion_cantidad"] },
  );

export type ContractFormValues = z.infer<typeof contractSchema>;

export const paymentSchema = z.object({
  contrato_id: z.string().min(1, "Selecciona un contrato"),
  monto: z.coerce.number().positive("Debe ser mayor a 0"),
  moneda: z.enum(["MXN", "USD"]).default("MXN"),
  tipo_cambio: z.coerce.number().positive("Debe ser mayor a 0").nullable().optional(),
  fecha_pago: z
    .string()
    .min(1, "La fecha de pago es requerida")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  periodo_mes: z.coerce
    .number()
    .int()
    .min(1, "Mes inválido")
    .max(12, "Mes inválido"),
  periodo_anio: z.coerce.number().int().min(2020, "Año inválido"),
  metodo_pago: z.string().min(1, "Selecciona un método de pago"),
  notas: z
    .string()
    .max(500, "Máximo 500 caracteres")
    .optional()
    .or(z.literal("")),
});

export type PaymentFormValues = z.infer<typeof paymentSchema>;

export const loginSchema = z.object({
  email: z.string().min(1, "El email es requerido").email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const createUserSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().min(1, "El email es requerido").email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  role: z.enum(["admin", "staff"], { required_error: "Selecciona un rol" }),
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;

export const requestAccountSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100, "Máximo 100 caracteres"),
  email: z.string().min(1, "El email es requerido").email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

export type RequestAccountFormValues = z.infer<typeof requestAccountSchema>;

export const profileSettingsSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(100, "Máximo 100 caracteres"),
  default_tipo_cambio: z.coerce
    .number()
    .positive("Debe ser mayor a 0")
    .nullable()
    .optional(),
});

export type ProfileSettingsFormValues = z.infer<typeof profileSettingsSchema>;
