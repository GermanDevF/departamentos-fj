import { getCurrentUser } from "@/lib/auth/actions";
import {
  getPropertyCount,
  getTenantCount,
  getActiveContractCount,
} from "@/lib/contracts/actions";
import {
  getPendingPaymentsCount,
  getMonthlyCollectedByCurrency,
  getMonthlyPendingAmount,
  getPendingDebtsByTenantForCurrentMonth,
} from "@/lib/payments/actions";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  IconHome,
  IconUsers,
  IconFileDescription,
  IconCash,
  IconCurrencyDollar,
  IconAlertTriangle,
  IconCircleCheck,
  IconArrowRight,
  IconPlus,
  IconChevronRight,
} from "@tabler/icons-react";

export const metadata: Metadata = {
  title: "Dashboard - Departamentos FJ",
};

const currencyFmtMxn = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

const currencyFmtUsd = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [
    propertyCount,
    tenantCount,
    activeContractCount,
    pendingPayments,
    monthlyCollected,
    monthlyPending,
    pendingDebtsByTenant,
  ] = await Promise.all([
    getPropertyCount(),
    getTenantCount(),
    getActiveContractCount(),
    getPendingPaymentsCount(),
    getMonthlyCollectedByCurrency(),
    getMonthlyPendingAmount(),
    getPendingDebtsByTenantForCurrentMonth(),
  ]);

  const totalExpected = monthlyCollected.mxn + monthlyPending;
  const collectionRate =
    totalExpected > 0
      ? Math.round((monthlyCollected.mxn / totalExpected) * 100)
      : 0;

  const now = new Date();
  const greeting = getGreeting(now);
  const dateStr = now.toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-sm font-medium capitalize text-muted-foreground">
          {dateStr}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          {greeting}, {user.name?.split(" ")[0] ?? "Usuario"}
        </h1>
      </div>

      {/* Resumen financiero */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Resumen del mes</h2>
          <Badge variant="secondary" className="font-mono text-xs">
            {now.toLocaleDateString("es-MX", { month: "short", year: "numeric" })}
          </Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="relative overflow-hidden">
            <div className="pointer-events-none absolute right-0 top-0 -mr-4 -mt-4 size-24 rounded-full bg-emerald-500/10" />
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <IconCircleCheck className="size-5" />
                </div>
                <CardDescription className="text-sm font-medium">
                  Recaudado
                </CardDescription>
              </div>
              <CardTitle className="space-y-1 text-3xl font-bold tabular-nums tracking-tight">
                <span className="block">
                  {currencyFmtMxn.format(monthlyCollected.mxn)}
                </span>
                {monthlyCollected.usd > 0 ? (
                  <span className="block text-xl font-semibold text-muted-foreground">
                    {currencyFmtUsd.format(monthlyCollected.usd)}
                  </span>
                ) : null}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="text-xs text-muted-foreground">
                Total cobrado este mes
              </p>
              {monthlyCollected.usd > 0 ? (
                <p className="text-xs text-muted-foreground">
                  El porcentaje de cobro usa solo montos en MXN frente a la renta
                  esperada en pesos.
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="pointer-events-none absolute right-0 top-0 -mr-4 -mt-4 size-24 rounded-full bg-amber-500/10" />
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <IconAlertTriangle className="size-5" />
                </div>
                <CardDescription className="text-sm font-medium">
                  Por cobrar
                </CardDescription>
              </div>
              <CardTitle className="text-3xl font-bold tabular-nums tracking-tight">
                {currencyFmtMxn.format(monthlyPending)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {pendingPayments > 0 ? (
                  <Badge
                    variant="destructive"
                    className="text-xs"
                  >
                    {pendingPayments}{" "}
                    {pendingPayments === 1 ? "contrato" : "contratos"} sin pago
                  </Badge>
                ) : (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                    Todos los contratos al corriente
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden sm:col-span-2 lg:col-span-1">
            <div className="pointer-events-none absolute right-0 top-0 -mr-4 -mt-4 size-24 rounded-full bg-primary/5" />
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <IconCurrencyDollar className="size-5" />
                </div>
                <CardDescription className="text-sm font-medium">
                  Meta mensual
                </CardDescription>
              </div>
              <CardTitle className="text-3xl font-bold tabular-nums tracking-tight">
                {currencyFmtMxn.format(totalExpected)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Progreso de cobro</span>
                <span className="font-mono font-semibold text-foreground">
                  {collectionRate}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${collectionRate}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Adeudos por inquilino (mes en curso) */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">Adeudos por inquilino</h2>
            <p className="text-sm text-muted-foreground">
              Renta del mes sin pago registrado (según precio del contrato en MXN).
            </p>
          </div>
          {pendingDebtsByTenant.length > 0 ? (
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/pagos">
                Registrar pago
                <IconArrowRight className="size-3.5" />
              </Link>
            </Button>
          ) : null}
        </div>

        <Card className="overflow-hidden">
          {pendingDebtsByTenant.length === 0 ? (
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No hay adeudos pendientes para este mes: todos los contratos
              activos tienen un pago registrado en el periodo.
            </CardContent>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-left text-xs font-medium tracking-wide text-muted-foreground">
                      <th className="px-4 py-3">Inquilino</th>
                      <th className="hidden px-4 py-3 sm:table-cell">Propiedad</th>
                      <th className="px-4 py-3 text-right">Adeudo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingDebtsByTenant.map((row) => (
                      <tr
                        key={row.contractId}
                        className="border-b border-border/80 last:border-0"
                      >
                        <td className="px-4 py-3">
                          <span className="font-medium">{row.tenantName}</span>
                          <span className="mt-0.5 block text-xs text-muted-foreground sm:hidden">
                            {row.propertyName}
                          </span>
                        </td>
                        <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                          {row.propertyName}
                        </td>
                        <td className="px-4 py-3 text-right text-base font-semibold tabular-nums">
                          {currencyFmtMxn.format(row.amountMxn)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <CardFooter className="flex flex-col gap-1 border-t bg-muted/20 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  {pendingDebtsByTenant.length}{" "}
                  {pendingDebtsByTenant.length === 1
                    ? "contrato con adeudo"
                    : "contratos con adeudo"}
                </p>
                <p className="text-sm font-semibold tabular-nums">
                  Total:{" "}
                  {currencyFmtMxn.format(
                    pendingDebtsByTenant.reduce((s, r) => s + r.amountMxn, 0),
                  )}
                </p>
              </CardFooter>
            </>
          )}
        </Card>
      </section>

      {/* Inventario */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Inventario</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <InventoryCard
            title="Propiedades"
            value={propertyCount}
            description="Registradas"
            href="/dashboard/propiedades"
            icon={<IconHome className="size-5" />}
          />
          <InventoryCard
            title="Inquilinos"
            value={tenantCount}
            description="Registrados"
            href="/dashboard/inquilinos"
            icon={<IconUsers className="size-5" />}
          />
          <InventoryCard
            title="Contratos activos"
            value={activeContractCount}
            description="En curso"
            href="/dashboard/contratos"
            icon={<IconFileDescription className="size-5" />}
          />
        </div>
      </section>

      {/* Acciones rápidas */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Acciones rápidas</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction
            label="Registrar pago"
            href="/dashboard/pagos"
            icon={<IconCash className="size-5" />}
          />
          <QuickAction
            label="Nueva propiedad"
            href="/dashboard/propiedades"
            icon={<IconHome className="size-5" />}
          />
          <QuickAction
            label="Nuevo inquilino"
            href="/dashboard/inquilinos"
            icon={<IconUsers className="size-5" />}
          />
          <QuickAction
            label="Nuevo contrato"
            href="/dashboard/contratos"
            icon={<IconFileDescription className="size-5" />}
          />
        </div>
      </section>
    </div>
  );
}

function InventoryCard({
  title,
  value,
  description,
  href,
  icon,
}: {
  title: string;
  value: number;
  description: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link href={href} className="group">
      <Card className="transition-colors group-hover:bg-muted/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              {icon}
            </div>
            <IconChevronRight className="size-4 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
          </div>
          <CardTitle className="mt-2 text-3xl font-bold tabular-nums">
            {value}
          </CardTitle>
          <CardDescription>{title}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function QuickAction({
  label,
  href,
  icon,
}: {
  label: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link href={href}>
      <Button
        variant="outline"
        className="h-auto w-full justify-start gap-3 px-4 py-3"
      >
        <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
          {icon}
        </div>
        <span className="text-sm font-medium">{label}</span>
        <IconArrowRight className="ml-auto size-4 text-muted-foreground" />
      </Button>
    </Link>
  );
}

function getGreeting(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}
