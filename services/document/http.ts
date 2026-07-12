import { BusinessError } from "@/services/shared/errors"

export function handleDocumentError(error: unknown) {
  if (error instanceof BusinessError) {
    return Response.json(
      {
        success: false,
        message: error.message,
      },
      {
        status: 404,
      },
    )
  }

  console.error(error)

  return Response.json(
    {
      success: false,
      message: "Ha ocurrido un error interno.",
    },
    {
      status: 500,
    },
  )
}
