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

  await prisma.$transaction([
    prisma.assignment.create({
      data: {
        employeeId,
        equipmentId,
        assignedAt: new Date(),
      },
    }),

    prisma.equipment.update({
      where: {
        id: equipmentId,
      },
      data: {
        status: "ASSIGNED",
      },
    }),
  ])
}
