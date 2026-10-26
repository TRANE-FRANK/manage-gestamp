import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"

import { NotFoundError } from "../shared/errors"

import { assignmentInclude } from "./queries"

const activeAssignmentWhere: Prisma.AssignmentWhereInput = {
  returnedAt: null,
  cancelledAt: null,
}

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
      ...activeAssignmentWhere,
    },
    include: assignmentInclude,
    orderBy: {
      assignedAt: "desc",
    },
  })
}

export async function findActiveAssignmentsPaginated({
  page,
  pageSize,
  where,
}: {
  page: number
  pageSize: number
  where?: Prisma.AssignmentWhereInput
}) {
  const skip = (page - 1) * pageSize

  const [data, total] = await prisma.$transaction([
    prisma.assignment.findMany({
      where: {
        ...activeAssignmentWhere,
        ...where,
      },
      include: assignmentInclude,
      orderBy: {
        assignedAt: "desc",
      },
      skip,
      take: pageSize,
    }),

    prisma.assignment.count({
      where: {
        ...activeAssignmentWhere,
        ...where,
      },
    }),
  ])

  return {
    data,
    total,
  }
}

export async function findAssignmentHistory() {
  return prisma.assignment.findMany({
    include: assignmentInclude,
    orderBy: {
      assignedAt: "desc",
    },
  })
}

export async function findAssignmentHistoryPaginated({
  page,
  pageSize,
  where,
}: {
  page: number
  pageSize: number
  where?: Prisma.AssignmentWhereInput
}) {
  const skip = (page - 1) * pageSize

  const [data, total] = await prisma.$transaction([
    prisma.assignment.findMany({
      where,
      include: assignmentInclude,
      orderBy: {
        assignedAt: "desc",
      },
      skip,
      take: pageSize,
    }),

    prisma.assignment.count({
      where,
    }),
  ])

  return {
    data,
    total,
  }
}

export async function findActiveAssignmentsByEmployeeId(employeeId: number) {
  return prisma.assignment.findMany({
    where: {
      employeeId,
      ...activeAssignmentWhere,
    },
    include: {
      equipment: true,
    },
    orderBy: {
      assignedAt: "desc",
    },
  })
}

export async function findActiveAssignmentByEquipment(equipmentId: number) {
  return prisma.assignment.findFirst({
    where: {
      equipmentId,
      ...activeAssignmentWhere,
    },
    include: {
      employee: true,
      equipment: true,
    },
    orderBy: {
      assignedAt: "desc",
    },
  })
}
