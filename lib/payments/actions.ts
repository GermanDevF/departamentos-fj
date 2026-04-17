"use server";

import { requireAuth, requireAdmin } from "@/lib/auth/authorization";
import type {
  Payment,
  Contract,
  Property,
  Tenant,
  CreatePaymentInput,
  UpdatePaymentInput,
  ActionResult,
} from "@/types";
import type { ContractRow } from "@/lib/contracts/actions";

export interface PaymentRow extends Payment {
  contracts: Contract & {
    properties: Property;
    tenants: Tenant;
  };
}

const VALID_METHODS = ["efectivo", "transferencia", "deposito", "otro"];

export async function getPayments(): Promise<ActionResult<PaymentRow[]>> {
  try {
    const { client } = await requireAuth();
    const { data, error } = await client.database
      .from("payments")
      .select("*, contracts(*, properties(*), tenants(*))")
      .order("created_at", { ascending: false });

    if (error)
      return {
        success: false,
        error: error.message ?? "Error al obtener pagos.",
      };
    return { success: true, data: (data as PaymentRow[]) ?? [] };
  } catch {
    return { success: false, error: "Error de conexión." };
  }
}

export async function createPayment(
  input: CreatePaymentInput,
): Promise<ActionResult<Payment>> {
  if (!input.contrato_id)
    return { success: false, error: "El contrato es requerido." };
  if (!input.monto || input.monto <= 0)
    return { success: false, error: "El monto debe ser mayor a 0." };
  if (!input.fecha_pago)
    return { success: false, error: "La fecha de pago es requerida." };
  if (!input.periodo_mes || input.periodo_mes < 1 || input.periodo_mes > 12)
    return {
      success: false,
      error: "El mes del periodo debe estar entre 1 y 12.",
    };
  if (!input.periodo_anio || input.periodo_anio < 2020)
    return { success: false, error: "El año del periodo no es válido." };
  if (!input.metodo_pago || !VALID_METHODS.includes(input.metodo_pago))
    return { success: false, error: "El método de pago no es válido." };

  try {
    const { client, userId } = await requireAdmin();

    const { data: contract, error: contractErr } = await client.database
      .from("contracts")
      .select("id, activo")
      .eq("id", input.contrato_id)
      .maybeSingle();

    if (contractErr || !contract)
      return { success: false, error: "Contrato no encontrado." };
    if (!(contract as Contract).activo)
      return { success: false, error: "El contrato no está activo." };

    const { data, error } = await client.database
      .from("payments")
      .insert([
        {
          user_id: userId,
          contrato_id: input.contrato_id,
          monto: input.monto,
          fecha_pago: input.fecha_pago,
          periodo_mes: input.periodo_mes,
          periodo_anio: input.periodo_anio,
          metodo_pago: input.metodo_pago,
          notas: input.notas?.trim() || null,
        },
      ])
      .select();

    if (error)
      return {
        success: false,
        error: error.message ?? "Error al registrar pago.",
      };
    return { success: true, data: (data as Payment[])?.[0] };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error de conexión.";
    return { success: false, error: msg };
  }
}

export async function updatePayment(
  id: string,
  input: UpdatePaymentInput,
): Promise<ActionResult<Payment>> {
  const updates: Record<string, unknown> = {};

  if (input.monto !== undefined) {
    if (input.monto <= 0)
      return { success: false, error: "El monto debe ser mayor a 0." };
    updates.monto = input.monto;
  }
  if (input.fecha_pago !== undefined) updates.fecha_pago = input.fecha_pago;
  if (input.periodo_mes !== undefined) {
    if (input.periodo_mes < 1 || input.periodo_mes > 12)
      return {
        success: false,
        error: "El mes del periodo debe estar entre 1 y 12.",
      };
    updates.periodo_mes = input.periodo_mes;
  }
  if (input.periodo_anio !== undefined) {
    if (input.periodo_anio < 2020)
      return { success: false, error: "El año del periodo no es válido." };
    updates.periodo_anio = input.periodo_anio;
  }
  if (input.metodo_pago !== undefined) {
    if (!VALID_METHODS.includes(input.metodo_pago))
      return { success: false, error: "El método de pago no es válido." };
    updates.metodo_pago = input.metodo_pago;
  }
  if (input.notas !== undefined) updates.notas = input.notas?.trim() || null;

  if (Object.keys(updates).length === 0)
    return { success: false, error: "No hay cambios." };

  try {
    const { client } = await requireAdmin();
    const { data, error } = await client.database
      .from("payments")
      .update(updates)
      .eq("id", id)
      .select();

    if (error)
      return { success: false, error: error.message ?? "Error al actualizar." };
    return { success: true, data: (data as Payment[])?.[0] };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error de conexión.";
    return { success: false, error: msg };
  }
}

export async function deletePayment(id: string): Promise<ActionResult> {
  try {
    const { client } = await requireAdmin();
    const { error } = await client.database
      .from("payments")
      .delete()
      .eq("id", id);

    if (error)
      return { success: false, error: error.message ?? "Error al eliminar." };
    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error de conexión.";
    return { success: false, error: msg };
  }
}

export async function getPendingPaymentsCount(): Promise<number> {
  try {
    const { client } = await requireAuth();
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const { data: activeContracts } = await client.database
      .from("contracts")
      .select("id")
      .eq("activo", true);

    if (!activeContracts || (activeContracts as Contract[]).length === 0)
      return 0;

    const contractIds = (activeContracts as Contract[]).map((c) => c.id);

    const { data: paidContracts } = await client.database
      .from("payments")
      .select("contrato_id")
      .eq("periodo_mes", currentMonth)
      .eq("periodo_anio", currentYear)
      .in("contrato_id", contractIds);

    const paidIds = new Set(
      (paidContracts as Payment[])?.map((p) => p.contrato_id) ?? [],
    );

    return contractIds.filter((id) => !paidIds.has(id)).length;
  } catch {
    return 0;
  }
}

export async function getMonthlyPendingAmount(): Promise<number> {
  try {
    const { client } = await requireAuth();
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const { data: activeContracts } = await client.database
      .from("contracts")
      .select("id, precio_mensual")
      .eq("activo", true);

    if (!activeContracts || (activeContracts as Contract[]).length === 0)
      return 0;

    const contracts = activeContracts as (Contract & {
      precio_mensual: number;
    })[];
    const contractIds = contracts.map((c) => c.id);

    const { data: paidContracts } = await client.database
      .from("payments")
      .select("contrato_id")
      .eq("periodo_mes", currentMonth)
      .eq("periodo_anio", currentYear)
      .in("contrato_id", contractIds);

    const paidIds = new Set(
      (paidContracts as Payment[])?.map((p) => p.contrato_id) ?? [],
    );

    return contracts
      .filter((c) => !paidIds.has(c.id))
      .reduce((sum, c) => sum + Number(c.precio_mensual), 0);
  } catch {
    return 0;
  }
}

function daysInCalendarMonth(year: number, month1to12: number): number {
  return new Date(year, month1to12, 0).getDate();
}

/** Fecha límite de pago del mes (YYYY-MM-DD), ajustada si `dia_pago` excede días del mes. */
function paymentDueDateInMonth(
  year: number,
  month1to12: number,
  diaPago: number,
): string {
  const dim = daysInCalendarMonth(year, month1to12);
  const day = Math.min(Math.max(1, Math.floor(diaPago)), dim);
  const m = String(month1to12).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

/** Contrato activo sin pago registrado para el mes en curso (renta en MXN). */
export type PendingDebtRow = {
  contractId: string;
  tenantName: string;
  propertyName: string;
  amountMxn: number;
  /** Fecha en que corresponde el pago del mes (según `dia_pago` del contrato), YYYY-MM-DD. */
  paymentDueDate: string;
};

export async function getPendingDebtsByTenantForCurrentMonth(): Promise<
  PendingDebtRow[]
> {
  try {
    const { client } = await requireAuth();
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const { data: rows, error } = await client.database
      .from("contracts")
      .select("id, precio_mensual, dia_pago, properties(nombre), tenants(nombre)")
      .eq("activo", true);

    if (error || !rows?.length) return [];

    const raw = rows as unknown as {
      id: string;
      precio_mensual: number;
      dia_pago: number;
      properties: { nombre: string } | { nombre: string }[] | null;
      tenants: { nombre: string } | { nombre: string }[] | null;
    }[];

    const contracts = raw.map((c) => ({
      id: c.id,
      precio_mensual: c.precio_mensual,
      dia_pago: Number(c.dia_pago) || 1,
      properties: Array.isArray(c.properties)
        ? (c.properties[0] ?? null)
        : c.properties,
      tenants: Array.isArray(c.tenants) ? (c.tenants[0] ?? null) : c.tenants,
    }));

    const contractIds = contracts.map((c) => c.id);

    const { data: paidRows } = await client.database
      .from("payments")
      .select("contrato_id")
      .eq("periodo_mes", currentMonth)
      .eq("periodo_anio", currentYear)
      .in("contrato_id", contractIds);

    const paidIds = new Set(
      (paidRows as Payment[])?.map((p) => p.contrato_id) ?? [],
    );

    return contracts
      .filter((c) => !paidIds.has(c.id))
      .map((c) => ({
        contractId: c.id,
        tenantName: c.tenants?.nombre ?? "—",
        propertyName: c.properties?.nombre ?? "—",
        amountMxn: Number(c.precio_mensual),
        paymentDueDate: paymentDueDateInMonth(
          currentYear,
          currentMonth,
          c.dia_pago,
        ),
      }))
      .sort((a, b) => {
        const byDate = a.paymentDueDate.localeCompare(b.paymentDueDate);
        if (byDate !== 0) return byDate;
        const byTenant = a.tenantName.localeCompare(b.tenantName, "es");
        if (byTenant !== 0) return byTenant;
        return a.propertyName.localeCompare(b.propertyName, "es");
      });
  } catch {
    return [];
  }
}

// --- Historial de pagos por contrato ---

export type PaymentPeriodStatus = "pagado" | "pendiente";

export interface ContractPaymentPeriod {
  mes: number;
  anio: number;
  estado: PaymentPeriodStatus;
  pago?: Payment;
  fechaVencimiento: string;
}

export interface ContractPaymentHistory {
  contrato: ContractRow;
  periodos: ContractPaymentPeriod[];
  totalPagados: number;
  totalPendientes: number;
}

export async function getPaymentHistoryByContrato(
  contratoId: string,
): Promise<ActionResult<ContractPaymentHistory>> {
  try {
    const { client } = await requireAuth();

    const { data: contractData, error: contractError } = await client.database
      .from("contracts")
      .select("*, properties(*), tenants(*)")
      .eq("id", contratoId)
      .maybeSingle();

    if (contractError || !contractData)
      return { success: false, error: "Contrato no encontrado." };

    const contrato = contractData as ContractRow;

    const { data: paymentsData, error: paymentsError } = await client.database
      .from("payments")
      .select("*")
      .eq("contrato_id", contratoId)
      .order("periodo_anio", { ascending: true })
      .order("periodo_mes", { ascending: true });

    if (paymentsError)
      return {
        success: false,
        error: paymentsError.message ?? "Error al obtener pagos.",
      };

    const paidMap = new Map<string, Payment>();
    for (const p of (paymentsData as Payment[]) ?? []) {
      paidMap.set(`${p.periodo_anio}-${p.periodo_mes}`, p);
    }

    const startDate = new Date(contrato.fecha_inicio + "T00:00:00");
    const now = new Date();
    const endYear = now.getFullYear();
    const endMonth = now.getMonth() + 1;

    const periodos: ContractPaymentPeriod[] = [];
    let year = startDate.getFullYear();
    let month = startDate.getMonth() + 1;

    while (year < endYear || (year === endYear && month <= endMonth)) {
      const key = `${year}-${month}`;
      const pago = paidMap.get(key);

      const dim = new Date(year, month, 0).getDate();
      const day = Math.min(Math.max(1, Math.floor(contrato.dia_pago)), dim);
      const fechaVencimiento = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      periodos.push({
        mes: month,
        anio: year,
        estado: pago ? "pagado" : "pendiente",
        pago,
        fechaVencimiento,
      });

      month++;
      if (month > 12) {
        month = 1;
        year++;
      }
    }

    const totalPagados = periodos.filter((p) => p.estado === "pagado").length;
    const totalPendientes = periodos.filter(
      (p) => p.estado === "pendiente",
    ).length;

    return {
      success: true,
      data: { contrato, periodos, totalPagados, totalPendientes },
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error de conexión.";
    return { success: false, error: msg };
  }
}

export type MonthlyCollectedByCurrency = { mxn: number; usd: number };

export async function getMonthlyCollectedByCurrency(): Promise<MonthlyCollectedByCurrency> {
  try {
    const { client } = await requireAuth();
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const { data } = await client.database
      .from("payments")
      .select("monto, moneda")
      .eq("periodo_mes", currentMonth)
      .eq("periodo_anio", currentYear);

    if (!data) return { mxn: 0, usd: 0 };

    return (data as { monto: number; moneda?: string }[]).reduce(
      (acc, p) => {
        const n = Number(p.monto);
        if (p.moneda === "USD") acc.usd += n;
        else acc.mxn += n;
        return acc;
      },
      { mxn: 0, usd: 0 },
    );
  } catch {
    return { mxn: 0, usd: 0 };
  }
}
