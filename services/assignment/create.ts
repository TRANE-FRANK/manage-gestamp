import { Prisma } from "@/generated/prisma/client"

import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth/authorization"
import { writeAuditEvent } from "@/services/audit/service"

import { CreateAssignmentDto } from "./types"

import { ConflictError } from "../shared/errors"

import { findActiveAssignmentByEquipment } from "./repository"

export async function createAssignment(dto: CreateAssignmentDto) {
  const actor = await requireRole("ADMIN", "IT")

  const { employeeId, equipmentId } = dto

  const activeAssignment = await findActiveAssignmentByEquipment(equipmentId)

  if (activeAssignment) {
    throw new ConflictError("El equipo ya se encuentra asignado.")
  }

  try {
    await prisma.$transaction(async (tx) => {
      const equipmentUpdate = await tx.equipment.updateMany({
        where: {
          id: equipmentId,
          status: "AVAILABLE",
        },
        data: {
          status: "ASSIGNED",
        },
      })

      if (equipmentUpdate.count === 0) {
        throw new ConflictError("El equipo no está disponible.")
      }

      const assignment = await tx.assignment.create({
        data: {
          employeeId,
          equipmentId,
          assignedAt: new Date(),
        },
        select: {
          id: true,
          employeeId: true,
          equipmentId: true,
          assignedAt: true,
          returnedAt: true,
          cancelledAt: true,
        },
      })

      await writeAuditEvent(tx, {
        actor,
        action: "ASSIGNMENT_CREATED",
        entityType: "ASSIGNMENT",
        entityId: String(assignment.id),
        outcome: "SUCCESS",
        source: "assignment.create",
        after: {
          employeeId: assignment.employeeId,
          equipmentId: assignment.equipmentId,
          assignedAt: assignment.assignedAt.toISOString(),
          returnedAt: assignment.returnedAt?.toISOString() ?? null,
          cancelledAt: assignment.cancelledAt?.toISOString() ?? null,
          equipmentStatus: "ASSIGNED",
        },
      })
    })
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ConflictError("El equipo ya se encuentra asignado.")
    }

    throw error
  }
}
