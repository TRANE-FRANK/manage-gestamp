import { Badge } from "@/components/ui/badge"

interface Props {
  generatedPdfPath: string | null
  signedPdfPath: string | null
}

export default function AssignmentStatus({
  generatedPdfPath,
  signedPdfPath,
}: Props) {
  if (!generatedPdfPath) {
    return <Badge variant="destructive">Sin generar</Badge>
  }

  if (!signedPdfPath) {
    return <Badge variant="ghost">Pendiente firma</Badge>
  }

  return <Badge variant="default">Generada y firmada</Badge>
}
