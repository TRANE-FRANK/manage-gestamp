import { Prisma } from "@/generated/prisma/client"

import type { Equipment } from "@/generated/prisma/client"

import { findEquipmentPaginated, findEquipmentById } from "./repository"

import type { ListEquipmentInput, PaginatedEquipmentResult } from "./types"

export async function listEquipmentPaginated({
  page = 1,
  pageSize = 20,
  search,
  company,
  status,
  type,
}: ListEquipmentInput = {}): Promise<PaginatedEquipmentResult<Equipment>> {
  const where: Prisma.EquipmentWhereInput = {}

  if (search?.trim()) {
    const searchTerm = search.trim()

    where.OR = [
      {
        assetTag: {
          contains: searchTerm,
          mode: "insensitive",
        },
      },
      {
        inventoryNumber: {
          contains: searchTerm,
          mode: "insensitive",
        },
      },
      {
        serialNumber: {
          contains: searchTerm,
          mode: "insensitive",
        },
      },
      {
        brand: {
          contains: searchTerm,
          mode: "insensitive",
        },
      },
      {
        model: {
          contains: searchTerm,
          mode: "insensitive",
        },
      },
    ]
  }

  if (company) {
    where.company = company
  }

  if (status) {
    where.status = status
  }

  if (type) {
    where.type = type
  }

  const result = await findEquipmentPaginated({
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

export async function getEquipmentDetails(id: number) {
  return findEquipmentById(id)
}
