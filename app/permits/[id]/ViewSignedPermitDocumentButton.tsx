"use client"

import { Button } from "@/components/ui/button"

interface Props {
  permitId: number
}

export default function ViewSignedPermitDocumentButton({ permitId }: Props) {
  function handleView() {
    window.open(
      `/api/permits/${permitId}/signed-document`,
      "_blank",
      "noopener,noreferrer",
    )
  }

  return (
    <Button type="button" variant="outline" onClick={handleView}>
      Ver PDF firmado
    </Button>
  )
}
