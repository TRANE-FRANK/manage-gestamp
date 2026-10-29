import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
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

export async function updatePermitGeneratedDocument(
  permitId: number,
  generatedPdfPath: string,
  tx?: Prisma.TransactionClient,
) {
  return (tx ?? prisma).permit.update({
    where: {
      id: permitId,
    },
    data: {
      generatedPdfPath,
    },
  })
}

export async function findPermitsPaginated({
  page,
  pageSize,
  where,
}: {
  page: number
  pageSize: number
  where?: Prisma.PermitWhereInput
}) {
  const skip = (page - 1) * pageSize

  const [data, total] = await prisma.$transaction([
    prisma.permit.findMany({
      where,
      include: permitInclude,
      orderBy: {
        expirationDate: "asc",
      },
      skip,
      take: pageSize,
    }),

    prisma.permit.count({
      where,
    }),
  ])

  return {
    data,
    total,
  }
}
