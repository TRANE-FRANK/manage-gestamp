import { NextResponse } from "next/server"

import { getActiveAssignmentsByEmployeeId } from "@/services/assignment"

interface Props {
  params: Promise<{
    id: string
  }>
}

export async function GET(_request: Request, { params }: Props) {
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
