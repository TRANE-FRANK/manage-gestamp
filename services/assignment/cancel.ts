import { EquipmentStatus } from "@/generated/prisma/enums"

import { prisma } from "@/lib/prisma"

import { BusinessError, ValidationError } from "@/services/shared/errors"

import { findAssignmentByIdOrThrow } from "./repository"

export interface CancelAssignmentResult {
  assignmentId: number
  employeeId: number
  equipmentId: number
  cancelledAt: Date
}

export async function cancelAssignment(
  assignmentId: number,
  reason: string,
): Promise<CancelAssignmentResult> {
  const cancellationReason = reason.trim()

  if (!cancellationReason) {
    throw new ValidationError("El motivo de anulación es obligatorio.")
  }

  const assignment = await findAssignmentByIdOrThrow(assignmentId)

  if (assignment.returnedAt) {
    throw new BusinessError("No se puede anular una asignación devuelta.")
  }

  if (assignment.cancelledAt) {
    throw new BusinessError("La asignación ya fue anulada.")
  }

  const cancelledAt = new Date()

  await prisma.$transaction(async (tx) => {
    const assignmentUpdate = await tx.assignment.updateMany({
      where: {
        id: assignmentId,
        returnedAt: null,
        cancelledAt: null,
      },
      data: {
        cancelledAt,
        cancellationReason,
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
    cancelledAt,
  }
}
