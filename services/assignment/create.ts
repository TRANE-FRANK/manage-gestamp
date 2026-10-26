import { Prisma } from "@/generated/prisma/client"

import { prisma } from "@/lib/prisma"

import { CreateAssignmentDto } from "./types"

import { ConflictError } from "../shared/errors"

import { findActiveAssignmentByEquipment } from "./repository"

export async function createAssignment(dto: CreateAssignmentDto) {
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

      await tx.assignment.create({
        data: {
          employeeId,
          equipmentId,
          assignedAt: new Date(),
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
