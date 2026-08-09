import { prisma } from "@/lib/prisma"

import { NotFoundError } from "../shared/errors"

import { assignmentInclude } from "./queries"

export async function findAssignmentById(id: number) {
  return prisma.assignment.findUnique({
    where: {
      id,
    },
    include: assignmentInclude,
  })
}

export async function findAssignmentByIdOrThrow(id: number) {
  const assignment = await findAssignmentById(id)

  if (!assignment) {
    throw new NotFoundError("La asignación no existe.")
  }

  return assignment
}

export async function findActiveAssignments() {
  return prisma.assignment.findMany({
    where: {
      returnedAt: null,
    },
    include: assignmentInclude,
    orderBy: {
      assignedAt: "desc",
    },
  })
}

export async function findAssignmentHistory() {
  return prisma.assignment.findMany({
    include: assignmentInclude,
    orderBy: {
      assignedAt: "desc",
    },
  })
}

export async function findActiveAssignmentByEquipment(equipmentId: number) {
  return prisma.assignment.findFirst({
    where: {
      equipmentId,
      returnedAt: null,
    },
  })
}
