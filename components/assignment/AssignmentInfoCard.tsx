import Card from "@/components/ui/Card"
import { Badge } from "@/components/ui/badge"

interface Props {
  assignedAt: Date
  returnedAt: Date | null
  generated: boolean
  signed: boolean
}

export default function AssignmentInformationCard({
  assignedAt,
  returnedAt,
  generated,
  signed,
}: Props) {
  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold">Información</h2>

      <div className="space-y-3">
        <p>
          <span className="font-semibold">Asignada:</span>{" "}
          {assignedAt.toLocaleDateString("es-MX")}
        </p>

        <p>
          <span className="font-semibold">Devuelta:</span>{" "}
          {returnedAt ? returnedAt.toLocaleDateString("es-MX") : "-"}
        </p>

        <div className="flex gap-2">
          {generated ? (
            <Badge variant="default">PDF generado</Badge>
          ) : (
            <Badge variant="destructive">Sin PDF</Badge>
          )}

          {signed && <Badge variant="default">Firmado</Badge>}
        </div>
      </div>
    </Card>
  )
}
