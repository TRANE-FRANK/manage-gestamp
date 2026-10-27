import { Prisma } from "@/generated/prisma/client"
import { requireRole } from "@/lib/auth/authorization"

import {
  findActiveAssignmentsByEmployeeId,
  findActiveAssignmentsPaginated,
  findAssignmentHistoryPaginated,
} from "./repository"

import type { ListAssignmentsInput } from "./types"

function buildAssignmentSearchWhere(
  search?: string,
): Prisma.AssignmentWhereInput {
  if (!search?.trim()) {
    return {}
  }

  const searchTerm = search.trim()
  const searchParts = searchTerm.split(/\s+/).filter(Boolean)

  return {
    OR: [
      {
        employee: {
          firstName: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
      },
      {
        employee: {
          lastName: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
      },
      {
        employee: {
          sapNumber: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
      },
      {
        equipment: {
          assetTag: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
      },
      {
        equipment: {
          inventoryNumber: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
      },
      {
        equipment: {
          serialNumber: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
      },

      ...searchParts.flatMap((part) => [
        {
          employee: {
            firstName: {
              contains: part,
              mode: "insensitive" as const,
            },
          },
        },
        {
          employee: {
            lastName: {
              contains: part,
              mode: "insensitive" as const,
            },
          },
        },
      ]),
    ],
  }
}

export async function getActiveAssignmentsByEmployeeId(employeeId: number) {
  await requireRole("ADMIN", "IT")
  return findActiveAssignmentsByEmployeeId(employeeId)
}

export async function listActiveAssignmentsPaginated({
  page = 1,
  pageSize = 20,
  search,
}: ListAssignmentsInput = {}) {
  await requireRole("ADMIN", "IT")
  const where = buildAssignmentSearchWhere(search)

  const result = await findActiveAssignmentsPaginated({
    page,
    pageSize,
    where,
  })

  return {
    ...result,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(result.total / pageSize)),
  }
}

export async function listAssignmentHistoryPaginated({
  page = 1,
  pageSize = 20,
  search,
}: ListAssignmentsInput = {}) {
  await requireRole("ADMIN", "IT")
  const where = buildAssignmentSearchWhere(search)

  const result = await findAssignmentHistoryPaginated({
    page,
    pageSize,
    where,
  })

  return {
    ...result,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(result.total / pageSize)),
  }
}
