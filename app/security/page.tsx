import SecurityScanner from "@/components/security/SecurityScanner"

export default function SecurityPage() {
  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="rounded-xl bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">
            Control de Vigilancia
          </h1>

          <p className="mt-2 text-slate-500">
            Escanee la etiqueta del equipo para verificar si está autorizado
            para salir.
          </p>
        </div>

        <SecurityScanner />
      </div>
    </main>
  )
}
