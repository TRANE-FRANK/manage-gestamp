import { EquipmentStatus } from "@/generated/prisma/enums"

import { prisma } from "@/lib/prisma"

import { BusinessError } from "@/services/shared/errors"

import { findAssignmentByIdOrThrow } from "./repository"

export interface ReturnAssignmentResult {
  assignmentId: number
  employeeId: number
  equipmentId: number
  returnedAt: Date
}

export async function returnAssignment(
  assignmentId: number,
): Promise<ReturnAssignmentResult> {
  const assignment = await findAssignmentByIdOrThrow(assignmentId)

  if (assignment.returnedAt) {
    throw new BusinessError("La asignación ya fue devuelta.")
  }

  if (assignment.cancelledAt) {
    throw new BusinessError("La asignación fue anulada.")
  }

  const returnedAt = new Date()

  await prisma.$transaction(async (tx) => {
    const assignmentUpdate = await tx.assignment.updateMany({
      where: {
        id: assignmentId,
        returnedAt: null,
        cancelledAt: null,
      },
      data: {
        returnedAt,
      },
    })

    if (assignmentUpdate.count === 0) {
      throw new BusinessError("La asignación ya fue devuelta o anulada.")
    }

    await tx.equipment.update({
      where: {
        id: assignment.equipmentId,
      },
      data: {
        status: EquipmentStatus.AVAILABLE,
      },
    })
  })

  return {
    assignmentId,
    employeeId: assignment.employeeId,
    equipmentId: assignment.equipmentId,
    returnedAt,
  }
}
