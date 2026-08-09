import Link from "next/link";

import { prisma } from "@/lib/prisma";

import SearchForm from "./search-form";

import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";

export default async function PermitsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    search?: string;
  }>;
}) {
  const { status, search } = await searchParams;

  const permits = await prisma.permit.findMany({
    include: {
      employee: true,
      equipment: true,
    },

    orderBy: {
      expirationDate: "asc",
    },
  });

  function calculateDaysRemaining(expirationDate: Date) {
    const now = new Date();

    const difference = expirationDate.getTime() - now.getTime();

    return Math.ceil(difference / (1000 * 60 * 60 * 24));
  }

  let filteredPermits = permits;

  if (search) {
    const searchTerm = search.toLowerCase();

    filteredPermits = filteredPermits.filter(
      (permit) =>
        permit.folio.toLowerCase().includes(searchTerm) ||
        permit.equipment.assetTag.toLowerCase().includes(searchTerm) ||
        permit.employee.firstName.toLowerCase().includes(searchTerm) ||
        permit.employee.lastName.toLowerCase().includes(searchTerm),
    );
  }

  if (status === "active") {
    filteredPermits = filteredPermits.filter((permit) => {
      const daysLeft = calculateDaysRemaining(permit.expirationDate);

      return daysLeft > 30;
    });
  }

  if (status === "expiring") {
    filteredPermits = filteredPermits.filter((permit) => {
      const daysLeft = calculateDaysRemaining(permit.expirationDate);

      return daysLeft >= 0 && daysLeft <= 30;
    });
  }

  if (status === "expired") {
    filteredPermits = filteredPermits.filter((permit) => {
      const daysLeft = calculateDaysRemaining(permit.expirationDate);

      return daysLeft < 0;
    });
  }

  return (
    <>
      <PageHeader
        title="Permisos de Salida"
        buttonText="Nuevo Permiso"
        buttonHref="/permits/new"
      />

      <Card>
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Link
            href="/permits"
            className="rounded-lg bg-slate-600 px-4 py-2 text-white transition hover:bg-slate-700"
          >
            Todos
          </Link>

          <Link
            href="/permits?status=active"
            className="rounded-lg bg-green-600 px-4 py-2 text-white transition hover:bg-green-700"
          >
            Activos
          </Link>

          <Link
            href="/permits?status=expiring"
            className="rounded-lg bg-orange-500 px-4 py-2 text-white transition hover:bg-orange-600"
          >
            Por vencer
          </Link>

          <Link
            href="/permits?status=expired"
            className="rounded-lg bg-red-600 px-4 py-2 text-white transition hover:bg-red-700"
          >
            Expirados
          </Link>

          <div className="ml-auto">
            <SearchForm />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="p-4 text-left font-semibold text-slate-700">
                  Folio
                </th>

                <th className="p-4 text-left font-semibold text-slate-700">
                  Usuario
                </th>

                <th className="p-4 text-left font-semibold text-slate-700">
                  Empresa
                </th>

                <th className="p-4 text-left font-semibold text-slate-700">
                  Equipo
                </th>

                <th className="p-4 text-left font-semibold text-slate-700">
                  Expiración
                </th>

                <th className="p-4 text-left font-semibold text-slate-700">
                  Estado
                </th>

                <th className="p-4 text-left font-semibold text-slate-700">
                  Días Restantes
                </th>

                <th className="p-4 text-left font-semibold text-slate-700">
                  PDF Firmado
                </th>

                <th className="p-4 text-left font-semibold text-slate-700">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredPermits.map((permit) => {
                const daysLeft = calculateDaysRemaining(permit.expirationDate);

                return (
                  <tr
                    key={permit.id}
                    className="border-b transition hover:bg-slate-50"
                  >
                    <td className="p-4 font-medium">{permit.folio}</td>

                    <td className="p-4">
                      {permit.employee.firstName} {permit.employee.lastName}
                    </td>

                    <td className="p-4">{permit.equipment.company}</td>

                    <td className="p-4 font-medium">
                      {permit.equipment.assetTag}
                    </td>

                    <td className="p-4">
                      {permit.expirationDate.toLocaleDateString("es-MX")}
                    </td>

                    <td className="p-4">
                      {daysLeft < 0 ? (
                        <Badge variant="destructive">Expirado</Badge>
                      ) : daysLeft <= 30 ? (
                        <Badge variant="outline">Por vencer</Badge>
                      ) : (
                        <Badge variant="default">Activo</Badge>
                      )}
                    </td>

                    <td className="p-4">
                      {daysLeft < 0
                        ? `Vencido hace ${Math.abs(daysLeft)} días`
                        : `${daysLeft} días`}
                    </td>

                    <td className="p-4">
                      {permit.signedPdfPath ? (
                        <Badge variant="default">Sí</Badge>
                      ) : (
                        <Badge variant="outline">Pendiente</Badge>
                      )}
                    </td>

                    <td className="p-4">
                      <Link
                        href={`/permits/${permit.id}/renew`}
                        className="rounded-lg bg-blue-700 px-3 py-2 text-white transition hover:bg-blue-800"
                      >
                        Renovar
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
