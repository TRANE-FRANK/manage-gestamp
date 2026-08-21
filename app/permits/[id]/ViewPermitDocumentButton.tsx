"use client"

export default function ViewPermitDocumentButton({
  permitId,
}: {
  permitId: number
}) {
  function handleView() {
    window.open(
      `/api/permits/${permitId}/document`,
      "_blank",
      "noopener,noreferrer",
    )
  }

  return (
    <button
      type="button"
      onClick={handleView}
      className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      Ver formato
    </button>
  )
}
