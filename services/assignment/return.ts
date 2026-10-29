import { EquipmentStatus } from "@/generated/prisma/enums"

import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth/authorization"
import { writeAuditEvent } from "@/services/audit/service"

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
  const actor = await requireRole("ADMIN", "IT")

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
      action: "ASSIGNMENT_RETURNED",
      entityType: "ASSIGNMENT",
      entityId: String(assignment.id),
      outcome: "SUCCESS",
      source: "assignment.return",
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
        returnedAt: returnedAt.toISOString(),
        cancelledAt: null,
        equipmentStatus: EquipmentStatus.AVAILABLE,
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
