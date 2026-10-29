import { EquipmentStatus } from "@/generated/prisma/enums"

import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth/authorization"
import { writeAuditEvent } from "@/services/audit/service"

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
  const actor = await requireRole("ADMIN", "IT")

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

    const equipment = await tx.equipment.findUniqueOrThrow({
      where: { id: assignment.equipmentId },
      select: { status: true },
    })

    await tx.equipment.update({
      where: {
        id: assignment.equipmentId,
      },
      data: {
        status: EquipmentStatus.AVAILABLE,
      },
    })

    await writeAuditEvent(tx, {
      actor,
      action: "ASSIGNMENT_CANCELLED",
      entityType: "ASSIGNMENT",
      entityId: String(assignment.id),
      outcome: "SUCCESS",
      source: "assignment.cancel",
      before: {
        employeeId: assignment.employeeId,
        equipmentId: assignment.equipmentId,
        assignedAt: assignment.assignedAt.toISOString(),
        returnedAt: null,
        cancelledAt: null,
        equipmentStatus: equipment.status,
      },
      after: {
        employeeId: assignment.employeeId,
        equipmentId: assignment.equipmentId,
        assignedAt: assignment.assignedAt.toISOString(),
        returnedAt: null,
        cancelledAt: cancelledAt.toISOString(),
        equipmentStatus: EquipmentStatus.AVAILABLE,
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
