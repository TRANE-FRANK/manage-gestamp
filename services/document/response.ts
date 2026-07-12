export function pdfResponse(pdf: Buffer, fileName?: string) {
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",

      "Content-Disposition": fileName
        ? `inline; filename="${fileName}"`
        : "inline",
    },
  })
}
