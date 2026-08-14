import { prisma } from "@/lib/prisma"

const permitInclude = {
  employee: true,
  equipment: true,
} as const

export async function findPermits() {
  return prisma.permit.findMany({
    include: permitInclude,

    orderBy: {
      expirationDate: "asc",
    },
  })
}

export async function findPermitById(id: number) {
  return prisma.permit.findUnique({
    where: {
      id,
    },

    include: permitInclude,
  })
}

export async function findPermitByFolio(folio: string) {
  return prisma.permit.findUnique({
    where: {
      folio,
    },

    include: permitInclude,
  })
}

export async function createPermit(data: {
  folio: string
  employeeId: number
  equipmentId: number
  startDate: Date
  expirationDate: Date
}) {
  return prisma.permit.create({
    data: {
      folio: data.folio,
      employeeId: data.employeeId,
      equipmentId: data.equipmentId,
      startDate: data.startDate,
      expirationDate: data.expirationDate,
      status: "ACTIVE",
    },
    include: {
      employee: true,
      equipment: true,
    },
  })
}

export async function findActivePermitByEquipmentId(
  equipmentId: number,
  excludePermitId?: number,
) {
  return prisma.permit.findFirst({
    where: {
      equipmentId,
      status: "ACTIVE",
      ...(excludePermitId
        ? {
            id: {
              not: excludePermitId,
            },
          }
        : {}),
    },
    include: permitInclude,
  })
}

export async function cancelPermit(id: number, reason: string) {
  return prisma.permit.update({
    where: {
      id,
    },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancellationReason: reason,
    },
  })
}

export async function findPermitForScan(folio: string) {
  return prisma.permit.findUnique({
    where: {
      folio,
    },
    include: {
      employee: true,
      equipment: true,
    },
  })
}
