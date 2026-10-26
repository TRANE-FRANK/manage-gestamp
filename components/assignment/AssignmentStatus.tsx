import { Badge } from "@/components/ui/badge"

interface Props {
  returnedAt: Date | null
  cancelledAt: Date | null
}

export default function AssignmentStatus({
  returnedAt,
  cancelledAt,
}: Props) {
  if (cancelledAt) {
    return <Badge variant="destructive">Anulada</Badge>
  }

  if (returnedAt) {
    return <Badge variant="outline">Devuelta</Badge>
  }

  return <Badge variant="default">Activa</Badge>
}
