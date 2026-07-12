import { prisma } from "@/lib/prisma";

export default async function RenewPermitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const permit = await prisma.permit.findUnique({
    where: {
      id: Number(id),
    },

    include: {
      employee: true,
      equipment: true,
    },
  });

  if (!permit) {
    return <div>Permit not found</div>;
  }

  return (
    <main className="p-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-3xl font-bold">Renovar Permiso</h1>

        <div className="space-y-2">
          <p>
            <strong>Empleado:</strong> {permit.employee.firstName}{" "}
            {permit.employee.lastName}
          </p>

          <p>
            <strong>Equipo:</strong> {permit.equipment.assetTag}
          </p>

          <p>
            <strong>Folio Actual:</strong> {permit.folio}
          </p>
        </div>
      </div>
    </main>
  );
}
