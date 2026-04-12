import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <span className="text-lg font-bold">Departamentos FJ</span>
          <Button asChild>
            <Link href="/login">Iniciar sesión</Link>
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-24">
        <div className="max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Administra tus propiedades en renta
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Gestiona tus casas y departamentos, controla pagos, lleva el
            registro de tus inquilinos y mantén todo organizado desde un solo
            lugar.
          </p>
          <div className="mt-10">
            <Button size="lg" asChild>
              <Link href="/login">Iniciar sesión</Link>
            </Button>
          </div>
        </div>
      </main>

      <footer className="border-t py-8">
        <p className="text-center text-sm text-muted-foreground">
          Departamentos FJ &mdash; Administración de inmuebles en renta
        </p>
      </footer>
    </div>
  );
}
