import { getCurrentUser } from "@/lib/auth/actions";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard - Departamentos FJ",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Bienvenido, {user.name ?? "Usuario"}
        </h1>
        <p className="mt-1 text-zinc-500 dark:text-zinc-400">
          Panel de administración de propiedades en renta
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardCard
          title="Propiedades"
          value="—"
          description="Total registradas"
        />
        <DashboardCard
          title="Inquilinos"
          value="—"
          description="Activos actualmente"
        />
        <DashboardCard
          title="Pagos del mes"
          value="—"
          description="Cobros pendientes"
        />
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Tu perfil
        </h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Nombre
            </dt>
            <dd className="mt-1 text-zinc-900 dark:text-zinc-100">
              {user.name ?? "Sin nombre"}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Email
            </dt>
            <dd className="mt-1 text-zinc-900 dark:text-zinc-100">
              {user.email}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Email verificado
            </dt>
            <dd className="mt-1 text-zinc-900 dark:text-zinc-100">
              {user.emailVerified ? "Sí" : "No"}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Cuenta creada
            </dt>
            <dd className="mt-1 text-zinc-900 dark:text-zinc-100">
              {new Date(user.createdAt).toLocaleDateString("es-MX", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

function DashboardCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
        {title}
      </p>
      <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        {description}
      </p>
    </div>
  );
}
