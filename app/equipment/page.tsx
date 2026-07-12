import { prisma } from "@/lib/prisma";

import EquipmentToast from "./equipment-toast";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

export default async function EquipmentPage() {
  const equipment = await prisma.equipment.findMany({
    orderBy: {
      assetTag: "asc",
    },
  });

  return (
    <>
      <PageHeader
        title="Equipos"
        buttonText="Nuevo Equipo"
        buttonHref="/equipment/new"
      />

      <Card>
        <div className="overflow-x-auto rounded-2xl">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="p-4 font-semibold text-slate-700">Equipo</th>
                <th className="p-4 font-semibold text-slate-700">Tipo</th>
                <th className="p-4 font-semibold text-slate-700">Marca</th>
                <th className="p-4 font-semibold text-slate-700">Modelo</th>
                <th className="p-4 font-semibold text-slate-700">Serial</th>
                <th className="p-4 font-semibold text-slate-700">Empresa</th>
                <th className="p-4 font-semibold text-slate-700">Estado</th>
              </tr>
            </thead>

            <tbody>
              {equipment.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No hay equipos registrados.
                  </td>
                </tr>
              ) : (
                equipment.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b transition hover:bg-slate-50 text-center"
                  >
                    <td className="p-4 font-medium">{item.assetTag}</td>

                    <td className="p-4">
                      {item.type === "LAPTOP" ? (
                        <Badge variant="laptop">Laptop</Badge>
                      ) : (
                        <Badge variant="desktop">Desktop</Badge>
                      )}
                    </td>

                    <td className="p-4">{item.brand ?? "-"}</td>

                    <td className="p-4">{item.model ?? "-"}</td>

                    <td className="p-4">{item.serialNumber ?? "-"}</td>

                    <td className="p-4">
                      {item.company === "ORM" ? (
                        <Badge variant="ORM">ORM</Badge>
                      ) : (
                        <Badge variant="GP2">GP2</Badge>
                      )}
                    </td>

                    <td className="p-4">
                      {item.status === "AVAILABLE" && (
                        <Badge variant="success">Disponible</Badge>
                      )}

                      {item.status === "ASSIGNED" && (
                        <Badge variant="warning">Asignado</Badge>
                      )}

                      {item.status === "MAINTENANCE" && (
                        <Badge variant="danger">Reparación</Badge>
                      )}

                      {item.status === "RETIRED" && (
                        <Badge variant="danger">Retirado</Badge>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
      <EquipmentToast />
    </>
  );
}
