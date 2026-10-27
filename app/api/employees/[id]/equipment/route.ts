import { NextResponse } from "next/server"

import { getActiveAssignmentsByEmployeeId } from "@/services/assignment"
import { AccessControlError, requireRole } from "@/lib/auth/authorization"

interface Props {
  params: Promise<{
    id: string
  }>
}

export async function GET(_request: Request, { params }: Props) {
  try {
    await requireRole("ADMIN", "IT")
  } catch (error) {
    if (!(error instanceof AccessControlError)) throw error

    return NextResponse.json(
      {
        message:
          error.code === "UNAUTHENTICATED"
            ? "Debes iniciar sesión para consultar esta información."
            : "No tienes permisos para consultar esta información.",
      },
      { status: error.code === "UNAUTHENTICATED" ? 401 : 403 },
    )
  }

  const { id } = await params

  const employeeId = Number(id)

  if (Number.isNaN(employeeId)) {
    return NextResponse.json(
      {
        message: "Empleado inválido.",
      },
      {
        status: 400,
      },
    )
  }

  const assignments = await getActiveAssignmentsByEmployeeId(employeeId)

  const equipment = assignments.map((assignment) => assignment.equipment)

  return NextResponse.json({
    equipment,
  })
}
