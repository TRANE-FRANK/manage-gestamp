import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function SecuritySearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    assetTag?: string;
  }>;
}) {
  const { assetTag } = await searchParams;

  if (!assetTag) {
    return (
      <main className="p-6">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-lg border border-red-500 p-6">
            <h2 className="text-2xl font-bold text-red-600">
              Equipo no encontrado
            </h2>
          </div>
        </div>
      </main>
    );
  }

  const equipment = await prisma.equipment.findUnique({
    where: {
      assetTag,
    },
  });

  if (!equipment) {
    return (
      <main className="p-6">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-lg border border-red-500 p-6">
            <h2 className="text-3xl font-bold text-red-600">
              ❌ EQUIPO NO REGISTRADO
            </h2>

            <p className="mt-4">
              Asset Tag:
              <strong> {assetTag}</strong>
            </p>

            <Link
              href="/security"
              className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-white"
            >
              Nueva búsqueda
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const permit = await prisma.permit.findFirst({
    where: {
      equipmentId: equipment.id,
    },

    include: {
      employee: true,
    },

    orderBy: {
      expirationDate: "desc",
    },
  });

  if (!permit) {
    return (
      <main className="p-6">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-lg border border-red-500 p-6">
            <h2 className="text-3xl font-bold text-red-600">
              ❌ SIN PERMISO REGISTRADO
            </h2>

            <p className="mt-4">
              Equipo:
              <strong> {equipment.assetTag}</strong>
            </p>

            <Link
              href="/security"
              className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-white"
            >
              Nueva búsqueda
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const daysLeft = Math.ceil(
    (permit.expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );

  const isAllowed = daysLeft >= 0;

  return (
    <main className="p-6">
      <div className="mx-auto max-w-3xl">
        <div
          className={`mb-6 rounded-lg p-6 text-white ${
            isAllowed ? "bg-green-600" : "bg-red-600"
          }`}
        >
          <h2 className="text-4xl font-bold">
            {isAllowed ? "✅ PERMITIDO" : "❌ DENEGADO"}
          </h2>
        </div>

        <div className="rounded-lg border p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">Empleado</p>

              <p className="text-xl font-semibold">
                {permit.employee.firstName} {permit.employee.lastName}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Departamento</p>

              <p className="text-xl font-semibold">
                {permit.employee.department ?? "Sin departamento"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Equipo</p>

              <p className="text-xl font-semibold">{equipment.assetTag}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Empresa</p>

              <p className="text-xl font-semibold">{equipment.company}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Folio</p>

              <p className="text-xl font-semibold">{permit.folio}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Vencimiento</p>

              <p className="text-xl font-semibold">
                {permit.expirationDate.toLocaleDateString("es-MX")}
              </p>
            </div>

            <div className="md:col-span-2">
              <p className="text-sm text-gray-500">Días restantes</p>

              <p
                className={`text-2xl font-bold ${
                  daysLeft <= 30 ? "text-orange-600" : "text-green-600"
                }`}
              >
                {daysLeft < 0
                  ? `Vencido hace ${Math.abs(daysLeft)} días`
                  : `${daysLeft} días`}
              </p>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Link
              href="/security"
              className="w-full text-center rounded-lg bg-blue-600 px-4 py-2 text-white"
            >
              Nueva búsqueda
            </Link>

            {permit.signedPdfPath && (
              <button className="rounded-lg bg-green-600 px-4 py-2 text-white">
                Ver PDF
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
