export default function SecurityPage() {
  return (
    <main className="p-6">
      <div className="mx-auto max-w-xl">
        <h1 className="mb-6 text-3xl font-bold">Control de Vigilancia</h1>

        <form action="/security/search" method="GET" className="space-y-4">
          <input
            type="text"
            name="assetTag"
            placeholder="Escanear equipo..."
            className="w-full rounded border p-3"
            autoFocus
          />

          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 text-white"
          >
            Buscar
          </button>
        </form>
      </div>
    </main>
  );
}
