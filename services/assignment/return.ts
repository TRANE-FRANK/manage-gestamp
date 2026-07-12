import { prisma } from "@/lib/prisma"

import { BusinessError } from "@/services/shared/errors"

import { findAssignmentByIdOrThrow } from "./repository"

export async function returnAssignment(assignmentId: number) {
  const assignment = await findAssignmentByIdOrThrow(assignmentId)

  if (assignment.returnedAt) {
    throw new BusinessError("La asignación ya fue devuelta.")
  }

  await prisma.$transaction([
    prisma.assignment.update({
      where: {
        id: assignmentId,
      },
      data: {
        returnedAt: new Date(),
      },
    }),

    prisma.equipment.update({
      where: {
        id: assignment.equipmentId,
      },
      data: {
        status: "AVAILABLE",
      },
    }),
  ])
}
