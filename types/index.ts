// --- Entidades base ---
// Datos de negocio compartidos por la empresa. `user_id` = quién creó el registro (auditoría).

export interface Direccion {
  id: string;
  user_id: string;
  nombre: string;
  calle: string;
  numero_exterior: string;
  numero_interior: string | null;
  colonia: string;
  ciudad: string;
  estado: string;
  cp: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export interface PropertyPhoto {
  url: string;
  storage_key: string;
}

export interface Property {
  id: string;
  user_id: string;
  nombre: string;
  direccion: string;
  descripcion: string | null;
  disponible: boolean;
  contrato_agua: string | null;
  contrato_luz: string | null;
  contrato_internet: string | null;
  direccion_id: string | null;
  fotos: PropertyPhoto[];
  created_at: string;
  updated_at: string;
}

export interface Tenant {
  id: string;
  user_id: string;
  nombre: string;
  telefono: string;
  email: string | null;
  ine_frontal_url: string | null;
  ine_frontal_key: string | null;
  ine_trasera_url: string | null;
  ine_trasera_key: string | null;
  created_at: string;
  updated_at: string;
}

export const TIPOS_DURACION = [
  { value: "horas", label: "Horas" },
  { value: "dias", label: "Días" },
  { value: "semanas", label: "Semanas" },
  { value: "meses", label: "Meses" },
  { value: "indefinido", label: "Indefinido" },
] as const;

export type TipoDuracion = (typeof TIPOS_DURACION)[number]["value"];

export interface Contract {
  id: string;
  user_id: string;
  propiedad_id: string;
  inquilino_id: string;
  fecha_inicio: string;
  tipo_duracion: TipoDuracion;
  duracion_cantidad: number | null;
  precio_mensual: number;
  moneda: PaymentMoneda;
  dia_pago: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

// --- Relaciones ---

export interface ContractWithRelations extends Contract {
  property: Property;
  tenant: Tenant;
}

// --- DTOs de entrada ---

export interface CreateDireccionInput {
  nombre: string;
  calle: string;
  numero_exterior: string;
  numero_interior?: string;
  colonia: string;
  ciudad: string;
  estado: string;
  cp?: string;
  notas?: string;
}

export type UpdateDireccionInput = Partial<CreateDireccionInput>;

export interface CreatePropertyInput {
  nombre: string;
  direccion: string;
  direccion_id?: string | null;
  descripcion?: string;
  disponible?: boolean;
  contrato_agua?: string;
  contrato_luz?: string;
  contrato_internet?: string;
}

export type UpdatePropertyInput = Partial<CreatePropertyInput>;

export interface CreateTenantInput {
  nombre: string;
  telefono: string;
  email?: string;
}

export type UpdateTenantInput = Partial<CreateTenantInput>;

export interface CreateContractInput {
  propiedad_id: string;
  inquilino_id: string;
  fecha_inicio: string;
  tipo_duracion: TipoDuracion;
  duracion_cantidad: number | null;
  precio_mensual: number;
  moneda: PaymentMoneda;
  dia_pago: number;
}

export type UpdateContractInput = Partial<
  Omit<CreateContractInput, "propiedad_id" | "inquilino_id">
> & {
  activo?: boolean;
};

export interface Payment {
  id: string;
  user_id: string;
  contrato_id: string;
  monto: number;
  moneda: PaymentMoneda;
  tipo_cambio: number | null;
  fecha_pago: string;
  periodo_mes: number;
  periodo_anio: number;
  metodo_pago: string;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

// --- DTOs de pago ---

export interface CreatePaymentInput {
  contrato_id: string;
  monto: number;
  moneda?: PaymentMoneda;
  tipo_cambio?: number | null;
  fecha_pago: string;
  periodo_mes: number;
  periodo_anio: number;
  metodo_pago: string;
  notas?: string;
}

export type UpdatePaymentInput = Partial<
  Omit<CreatePaymentInput, "contrato_id">
>;

export const PAYMENT_MONEDAS = [
  { value: "MXN", label: "MXN" },
  { value: "USD", label: "USD" },
] as const;

export type PaymentMoneda = (typeof PAYMENT_MONEDAS)[number]["value"];

export const METODOS_PAGO = [
  { value: "efectivo", label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
  { value: "deposito", label: "Depósito" },
  { value: "otro", label: "Otro" },
] as const;

export type MetodoPago = (typeof METODOS_PAGO)[number]["value"];

// --- Resultado genérico de action ---

export interface ActionResult<T = void> {
  success: boolean;
  error?: string;
  data?: T;
}
