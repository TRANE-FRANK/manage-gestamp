import { BusinessError } from "@/services/shared/errors"
import { AccessControlError } from "@/lib/auth/authorization"

export function handleDocumentError(error: unknown) {
  if (error instanceof AccessControlError) {
    return Response.json(
      {
        success: false,
        message:
          error.code === "UNAUTHENTICATED"
            ? "Debes iniciar sesión para descargar este documento."
            : "No tienes permisos para descargar este documento.",
      },
      {
        status: error.code === "UNAUTHENTICATED" ? 401 : 403,
      },
    )
  }

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
