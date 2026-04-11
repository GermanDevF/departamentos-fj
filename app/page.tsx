import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
            Departamentos FJ
          </span>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-24">
        <div className="max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
            Administra tus propiedades en renta
          </h1>
          <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Gestiona tus casas y departamentos, controla pagos, lleva el
            registro de tus inquilinos y mantén todo organizado desde un solo
            lugar.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-blue-700"
            >
              Comenzar gratis
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-zinc-300 px-6 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-200 py-8 dark:border-zinc-800">
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          Departamentos FJ &mdash; Administración de inmuebles en renta
        </p>
      </footer>
    </div>
  );
}
