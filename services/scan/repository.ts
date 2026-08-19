import { prisma } from "@/lib/prisma"

const permitInclude = {
  employee: true,
  equipment: true,
} as const

export async function findEquipmentByAssetTag(assetTag: string) {
  return prisma.equipment.findUnique({
    where: {
      assetTag,
    },
  })
}

export async function findLatestPermitByEquipmentId(equipmentId: number) {
  return prisma.permit.findFirst({
    where: {
      equipmentId,
    },
    include: permitInclude,
    orderBy: {
      createdAt: "desc",
    },
  })
}

export async function createScanLog(data: {
  permitId?: number
  assetTag: string
  result: "ALLOWED" | "DENIED"
  reason:
    | "ALLOWED"
    | "INVALID_ASSET_TAG"
    | "EQUIPMENT_NOT_FOUND"
    | "NO_PERMIT"
    | "CANCELLED"
    | "EXPIRED"
    | "NOT_STARTED"
    | "NOT_ACTIVE"
  notes?: string
}) {
  return prisma.scanLog.create({
    data: {
      ...(data.permitId !== undefined
        ? {
            permitId: data.permitId,
          }
        : {}),
      assetTag: data.assetTag,
      result: data.result,
      reason: data.reason,
      ...(data.notes
        ? {
            notes: data.notes,
          }
        : {}),
    },
  })
}

export async function findScanLogs(filters?: {
  startDate?: Date
  endDate?: Date
  result?: "ALLOWED" | "DENIED"
  search?: string
  page?: number
  pageSize?: number
}) {
  const page = Math.max(filters?.page ?? 1, 1)
  const pageSize = Math.max(filters?.pageSize ?? 50, 1)
  const skip = (page - 1) * pageSize

  const where = {
    ...(filters?.startDate || filters?.endDate
      ? {
          scannedAt: {
            ...(filters.startDate ? { gte: filters.startDate } : {}),
            ...(filters.endDate ? { lt: filters.endDate } : {}),
          },
        }
      : {}),

    ...(filters?.result
      ? {
          result: filters.result,
        }
      : {}),

    ...(filters?.search
      ? {
          OR: [
            {
              assetTag: {
                contains: filters.search,
                mode: "insensitive" as const,
              },
            },
            {
              permit: {
                employee: {
                  firstName: {
                    contains: filters.search,
                    mode: "insensitive" as const,
                  },
                },
              },
            },
            {
              permit: {
                employee: {
                  lastName: {
                    contains: filters.search,
                    mode: "insensitive" as const,
                  },
                },
              },
            },
            {
              permit: {
                folio: {
                  contains: filters.search,
                  mode: "insensitive" as const,
                },
              },
            },
          ],
        }
      : {}),
  }

  const [items, total] = await Promise.all([
    prisma.scanLog.findMany({
      where,
      include: {
        permit: {
          include: {
            employee: true,
            equipment: true,
          },
        },
      },
      orderBy: {
        scannedAt: "desc",
      },
      skip,
      take: pageSize,
    }),

    prisma.scanLog.count({
      where,
    }),
  ])

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

export async function getScanLogStats(filters: {
  startDate: Date
  endDate: Date
  result?: "ALLOWED" | "DENIED"
  search?: string
}) {
  const where = {
    scannedAt: {
      gte: filters.startDate,
      lt: filters.endDate,
    },

    ...(filters.result
      ? {
          result: filters.result,
        }
      : {}),

    ...(filters.search
      ? {
          OR: [
            {
              assetTag: {
                contains: filters.search,
                mode: "insensitive" as const,
              },
            },
            {
              permit: {
                employee: {
                  firstName: {
                    contains: filters.search,
                    mode: "insensitive" as const,
                  },
                },
              },
            },
            {
              permit: {
                employee: {
                  lastName: {
                    contains: filters.search,
                    mode: "insensitive" as const,
                  },
                },
              },
            },
            {
              permit: {
                folio: {
                  contains: filters.search,
                  mode: "insensitive" as const,
                },
              },
            },
          ],
        }
      : {}),
  }

  const [total, allowed, denied, equipmentLogs] = await Promise.all([
    prisma.scanLog.count({
      where,
    }),

    prisma.scanLog.count({
      where: {
        ...where,
        result: "ALLOWED",
      },
    }),

    prisma.scanLog.count({
      where: {
        ...where,
        result: "DENIED",
      },
    }),

    prisma.scanLog.findMany({
      where: {
        ...where,
        assetTag: {
          not: null,
        },
      },
      select: {
        assetTag: true,
      },
    }),
  ])

  const uniqueEquipment = new Set(
    equipmentLogs
      .map((log) => log.assetTag)
      .filter((assetTag): assetTag is string => assetTag !== null),
  ).size

  return {
    total,
    allowed,
    denied,
    uniqueEquipment,
  }
}

export async function getAllowedScansByEquipment(
  startDate: Date,
  endDate: Date,
) {
  return prisma.scanLog.findMany({
    where: {
      scannedAt: {
        gte: startDate,
        lt: endDate,
      },
      result: "ALLOWED",
    },
    select: {
      assetTag: true,
      permit: {
        select: {
          equipment: {
            select: {
              assetTag: true,
            },
          },
          employee: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
    orderBy: {
      scannedAt: "desc",
    },
  })
}

export async function getAllowedScansByEmployee(filters: {
  startDate: Date
  endDate: Date
  search?: string
}) {
  return prisma.scanLog.findMany({
    where: {
      scannedAt: {
        gte: filters.startDate,
        lt: filters.endDate,
      },
      result: "ALLOWED",

      permitId: {
        not: null,
      },

      ...(filters.search
        ? {
            OR: [
              {
                assetTag: {
                  contains: filters.search,
                  mode: "insensitive",
                },
              },
              {
                permit: {
                  employee: {
                    firstName: {
                      contains: filters.search,
                      mode: "insensitive",
                    },
                  },
                },
              },
              {
                permit: {
                  employee: {
                    lastName: {
                      contains: filters.search,
                      mode: "insensitive",
                    },
                  },
                },
              },
              {
                permit: {
                  folio: {
                    contains: filters.search,
                    mode: "insensitive",
                  },
                },
              },
            ],
          }
        : {}),
    },

    select: {
      permit: {
        select: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },

    orderBy: {
      scannedAt: "desc",
    },
  })
}

export async function getScanReasonStats(filters: {
  startDate: Date
  endDate: Date
  result?: "ALLOWED" | "DENIED"
  search?: string
}) {
  const where = {
    scannedAt: {
      gte: filters.startDate,
      lt: filters.endDate,
    },

    ...(filters.result
      ? {
          result: filters.result,
        }
      : {}),

    ...(filters.search
      ? {
          OR: [
            {
              assetTag: {
                contains: filters.search,
                mode: "insensitive" as const,
              },
            },
            {
              permit: {
                employee: {
                  firstName: {
                    contains: filters.search,
                    mode: "insensitive" as const,
                  },
                },
              },
            },
            {
              permit: {
                employee: {
                  lastName: {
                    contains: filters.search,
                    mode: "insensitive" as const,
                  },
                },
              },
            },
            {
              permit: {
                folio: {
                  contains: filters.search,
                  mode: "insensitive" as const,
                },
              },
            },
          ],
        }
      : {}),
  }

  return prisma.scanLog.groupBy({
    by: ["reason"],
    where,
    _count: {
      reason: true,
    },
  })
}
