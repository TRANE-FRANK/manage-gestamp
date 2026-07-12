import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-50 p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold text-zinc-900">Manage Gestamp</h1>
        <p className="mt-2 text-zinc-600">
          Equipment inventory, permits, maintenance and security validation.
        </p>

        <div className="mt-8 flex gap-3">
          <Link
            href="/equipment"
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Go to equipment
          </Link>
        </div>
      </div>
    </main>
  );
}