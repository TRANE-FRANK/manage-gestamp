import { ShieldCheck } from "lucide-react";

import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="flex h-dvh items-start justify-center overflow-y-auto bg-slate-100 px-4 py-10 sm:items-center">
      <section className="my-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5 sm:p-10">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-blue-700 text-white">
            <ShieldCheck aria-hidden="true" className="size-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
              Gestamp México
            </p>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              Administración TI
            </h1>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Inicia sesión</h2>
          <p className="mt-1 text-sm text-slate-500">
            Ingresa con tu cuenta de Manage Gestamp.
          </p>
        </div>

        <LoginForm />
      </section>
    </main>
  );
}
