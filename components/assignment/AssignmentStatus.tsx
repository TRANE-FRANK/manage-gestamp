import Badge from "@/components/ui/Badge"

interface Props {
  generatedPdfPath: string | null
  signedPdfPath: string | null
}

export default function AssignmentStatus({
  generatedPdfPath,
  signedPdfPath,
}: Props) {
  if (!generatedPdfPath) {
    return <Badge variant="danger">Sin generar</Badge>
  }

  if (!signedPdfPath) {
    return <Badge variant="warning">Pendiente firma</Badge>
  }

  return <Badge variant="success">Firmada</Badge>
}
