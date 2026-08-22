import { Prisma } from "@/generated/prisma/client"

import { prisma } from "@/lib/prisma"

export async function findEquipmentPaginated({
  page,
  pageSize,
  where,
}: {
  page: number
  pageSize: number
  where?: Prisma.EquipmentWhereInput
}) {
  const skip = (page - 1) * pageSize

  const [data, total] = await prisma.$transaction([
    prisma.equipment.findMany({
      where,
      orderBy: {
        assetTag: "asc",
      },
      skip,
      take: pageSize,
    }),

    prisma.equipment.count({
      where,
    }),
  ])

  return {
    data,
    total,
  }
}

export async function findEquipmentById(id: number) {
  return prisma.equipment.findUnique({
    where: {
      id,
    },
    include: {
      assignments: {
        include: {
          employee: true,
        },
        orderBy: {
          assignedAt: "desc",
        },
      },
      permits: {
        include: {
          employee: true,
        },
        orderBy: {
          startDate: "desc",
        },
      },
    },
  })
}
