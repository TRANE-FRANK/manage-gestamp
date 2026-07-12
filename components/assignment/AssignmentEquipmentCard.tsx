import Card from "@/components/ui/Card"

interface Props {
  equipment: {
    assetTag: string
    brand: string | null
    model: string | null
    serialNumber: string | null
    inventoryNumber: string | null
    company: string
    type: string | null
  }
}

export default function AssignmentEquipmentCard({ equipment }: Props) {
  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold">Equipo</h2>

      <div className="space-y-2">
        <p>
          <span className="font-semibold">Activo:</span> {equipment.assetTag}
        </p>

        <p>
          <span className="font-semibold">Marca:</span> {equipment.brand ?? "-"}
        </p>

        <p>
          <span className="font-semibold">Modelo:</span>{" "}
          {equipment.model ?? "-"}
        </p>

        <p>
          <span className="font-semibold">Serie:</span>{" "}
          {equipment.serialNumber ?? "-"}
        </p>

        <p>
          <span className="font-semibold">Inventario:</span>{" "}
          {equipment.inventoryNumber ?? "-"}
        </p>
      </div>
    </Card>
  )
}
