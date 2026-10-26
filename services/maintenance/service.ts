import { Prisma } from "@/generated/prisma/client"

import { prisma } from "@/lib/prisma"

import {
  BusinessError,
  ConflictError,
  ValidationError,
} from "@/services/shared/errors"

const equipmentSelect = {
  id: true,
  assetTag: true,
  inventoryNumber: true,
  serialNumber: true,
  company: true,
  brand: true,
  model: true,
  type: true,
} as const

export type MaintenanceEquipmentOption = Prisma.EquipmentGetPayload<{
  select: typeof equipmentSelect
}>

const PAGE_SIZE = 10

function parseHistoryCalendarDate(value: string | undefined, label: string) {
  const normalized = value?.trim() ?? ""
  if (!normalized) return { date: undefined as Date | undefined }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return { error: `La ${label} debe tener el formato AAAA-MM-DD.` }
  }

  if (Number(normalized.slice(0, 4)) < 1) {
    return { error: `La ${label} no es una fecha válida.` }
  }

  const date = new Date(`${normalized}T00:00:00.000Z`)
  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== normalized
  ) {
    return { error: `La ${label} no es una fecha válida.` }
  }

  return { date }
}

async function listMaintenanceProviderOptions() {
  const rows = await prisma.$queryRaw<Array<{ provider: string }>>`
    SELECT DISTINCT "provider"
    FROM "Maintenance"
    WHERE "provider" IS NOT NULL
      AND BTRIM("provider") <> ''
    ORDER BY "provider" ASC
  `

  return rows.map(({ provider }) => provider)
}

const maintenanceHistoryInclude = {
  equipment: {
    select: {
      id: true,
      inventoryNumber: true,
      assetTag: true,
      serialNumber: true,
      barcode: true,
      brand: true,
      model: true,
    },
  },
  batch: {
    select: {
      id: true,
    },
  },
} as const

export type MaintenanceHistoryRecord = Prisma.MaintenanceGetPayload<{
  include: typeof maintenanceHistoryInclude
}>

export async function listMaintenanceHistory({
  page = 1,
  search,
  from,
  to,
  provider,
  equipmentId,
  pageSize = PAGE_SIZE,
}: {
  page?: number
  search?: string
  from?: string
  to?: string
  provider?: string
  equipmentId?: number
  pageSize?: number
} = {}) {
  const currentPage = Number.isInteger(page) && page > 0 ? page : 1
  const safePageSize =
    Number.isInteger(pageSize) && pageSize > 0 ? pageSize : PAGE_SIZE
  const searchTerm = search?.trim()
  const providerValue = provider ?? ""
  const providerFilter = providerValue.trim() ? providerValue : ""
  const parsedFrom = parseHistoryCalendarDate(from, "fecha inicial")
  const parsedTo = parseHistoryCalendarDate(to, "fecha final")
  const filterError =
    ("error" in parsedFrom && parsedFrom.error) ||
    ("error" in parsedTo && parsedTo.error) ||
    (parsedFrom.date && parsedTo.date && parsedFrom.date > parsedTo.date
      ? "La fecha inicial no puede ser posterior a la fecha final."
      : null)
  const providersPromise = listMaintenanceProviderOptions()

  if (filterError) {
    const providers = await providersPromise
    return {
      data: [],
      page: 1,
      pageSize: safePageSize,
      total: 0,
      totalPages: 1,
      providers,
      filterError,
    }
  }

  const where: Prisma.MaintenanceWhereInput = {
    ...(equipmentId ? { equipmentId } : {}),
    ...(providerFilter ? { provider: providerFilter } : {}),
    ...(parsedFrom.date || parsedTo.date
      ? {
          maintenanceDate: {
            ...(parsedFrom.date ? { gte: parsedFrom.date } : {}),
            ...(parsedTo.date ? { lte: parsedTo.date } : {}),
          },
        }
      : {}),
    ...(searchTerm
      ? {
          OR: [
            { provider: { contains: searchTerm, mode: "insensitive" } },
            { folio: { contains: searchTerm, mode: "insensitive" } },
            { notes: { contains: searchTerm, mode: "insensitive" } },
            {
              equipment: {
                is: {
                  OR: [
                    {
                      inventoryNumber: {
                        contains: searchTerm,
                        mode: "insensitive",
                      },
                    },
                    { assetTag: { contains: searchTerm, mode: "insensitive" } },
                    {
                      serialNumber: {
                        contains: searchTerm,
                        mode: "insensitive",
                      },
                    },
                    { barcode: { contains: searchTerm, mode: "insensitive" } },
                    { brand: { contains: searchTerm, mode: "insensitive" } },
                    { model: { contains: searchTerm, mode: "insensitive" } },
                  ],
                },
              },
            },
          ],
        }
      : {}),
  }
  const [providers, result] = await Promise.all([
    providersPromise,
    prisma.$transaction(async (tx) => {
      const total = await tx.maintenance.count({ where })
      const totalPages = Math.max(1, Math.ceil(total / safePageSize))
      const safePage = Math.min(currentPage, totalPages)
      const skip = (safePage - 1) * safePageSize
      const data = await tx.maintenance.findMany({
        where,
        include: maintenanceHistoryInclude,
        orderBy: [
          { maintenanceDate: "desc" },
          { createdAt: "desc" },
          { id: "desc" },
        ],
        skip,
        take: safePageSize,
      })

      return { data, page: safePage, total, totalPages }
    }),
  ])

  return {
    ...result,
    pageSize: safePageSize,
    providers,
    filterError: null,
  }
}

export async function getEquipmentMaintenanceHistory(equipmentId: number) {
  const records = await prisma.maintenance.findMany({
    where: { equipmentId },
    include: maintenanceHistoryInclude,
    orderBy: [
      { maintenanceDate: "desc" },
      { createdAt: "desc" },
      { id: "desc" },
    ],
  })
  return { records }
}

export async function listEligibleMaintenanceEquipment({
  page = 1,
  search,
  company,
  type,
  historyMode,
  lastMaintenanceBefore,
}: {
  page?: number
  search?: string
  company?: string
  type?: string
  historyMode?: string
  lastMaintenanceBefore?: string
} = {}) {
  const currentPage = Number.isInteger(page) && page > 0 ? page : 1
  const searchTerm = search?.trim()
  const companyFilter = company ?? "all"
  const typeFilter = type ?? "all"
  const maintenanceHistoryFilter = historyMode ?? "all"
  const historyCutoff = parseHistoryCalendarDate(
    maintenanceHistoryFilter === "last-before" ? lastMaintenanceBefore : undefined,
    "fecha de último mantenimiento",
  )
  const filterError =
    !["all", "ORM", "GP2"].includes(companyFilter)
      ? "Selecciona una empresa válida."
      : !["all", "LAPTOP", "DESKTOP"].includes(typeFilter)
        ? "Selecciona un tipo de equipo válido."
        : !["all", "none", "last-before"].includes(maintenanceHistoryFilter)
          ? "Selecciona un filtro de historial válido."
          : maintenanceHistoryFilter === "last-before" &&
              !historyCutoff.date &&
              !("error" in historyCutoff)
            ? "Selecciona la fecha de último mantenimiento."
          : "error" in historyCutoff
            ? historyCutoff.error
            : null

  if (filterError) {
    return {
      data: [],
      page: 1,
      pageSize: PAGE_SIZE,
      total: 0,
      totalPages: 1,
      filterError,
    }
  }

  const where: Prisma.EquipmentWhereInput = {
    company:
      companyFilter === "all"
        ? { in: ["ORM", "GP2"] }
        : (companyFilter as "ORM" | "GP2"),
    type:
      typeFilter === "all"
        ? { in: ["LAPTOP", "DESKTOP"] }
        : (typeFilter as "LAPTOP" | "DESKTOP"),
    ...(maintenanceHistoryFilter === "none"
      ? { maintenances: { none: {} } }
      : maintenanceHistoryFilter === "last-before" && historyCutoff.date
        ? {
            AND: [
              { maintenances: { some: {} } },
              {
                maintenances: {
                  none: { maintenanceDate: { gt: historyCutoff.date } },
                },
              },
            ],
          }
        : {}),
    ...(searchTerm
      ? {
          OR: [
            {
              inventoryNumber: {
                contains: searchTerm,
                mode: "insensitive",
              },
            },
            {
              assetTag: {
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
          ],
        }
      : {}),
  }

  const result = await prisma.$transaction(async (tx) => {
    const total = await tx.equipment.count({ where })
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
    const safePage = Math.min(currentPage, totalPages)
    const data = await tx.equipment.findMany({
      where,
      select: equipmentSelect,
      orderBy: [
        { inventoryNumber: "asc" },
        { assetTag: "asc" },
        { serialNumber: "asc" },
        { id: "asc" },
      ],
      skip: (safePage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    })

    return { data, page: safePage, total, totalPages }
  })

  return {
    ...result,
    pageSize: PAGE_SIZE,
    filterError: null,
  }
}

function parseEffectiveDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ValidationError("Selecciona una fecha efectiva válida.")
  }

  const date = new Date(`${value}T00:00:00.000Z`)

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new ValidationError("Selecciona una fecha efectiva válida.")
  }

  return date
}

async function ensureMaintenanceMigrationIsApplied() {
  const [schemaState] = await prisma.$queryRaw<Array<{ ready: boolean }>>`
    SELECT
      to_regclass('public."MaintenanceBatch"') IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM pg_index
        WHERE indexrelid = to_regclass(
          'public."Maintenance_equipmentId_maintenanceDate_key"'
        )
          AND indisunique
          AND indisvalid
      )
      AND EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Maintenance'
          AND column_name = 'batchId'
      )
      AND EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Maintenance'
          AND column_name = 'maintenanceDate'
          AND data_type = 'date'
      ) AS ready
  `

  if (!schemaState?.ready) {
    throw new BusinessError(
      "La base de datos aún no tiene aplicada la migración de Mantenimientos. Aplica la migración pendiente antes de registrar servicios.",
    )
  }
}

export async function registerMaintenanceBatch({
  maintenanceDate: maintenanceDateInput,
  provider: providerInput,
  notes: notesInput,
  equipmentIds,
}: {
  maintenanceDate: string
  provider: string
  notes: string
  equipmentIds: number[]
}) {
  const maintenanceDate = parseEffectiveDate(maintenanceDateInput)
  const ids = equipmentIds

  if (ids.length === 0) {
    throw new ValidationError("Selecciona al menos un equipo.")
  }

  if (ids.some((id) => !Number.isInteger(id) || id <= 0)) {
    throw new ValidationError("La selección contiene un equipo no válido.")
  }

  if (new Set(ids).size !== ids.length) {
    throw new ValidationError("La lista contiene equipos repetidos.")
  }

  const provider = providerInput.trim() || null
  const notes = notesInput.trim() || null

  await ensureMaintenanceMigrationIsApplied()

  try {
    return await prisma.$transaction(async (tx) => {
      // Lock in stable order so company/type cannot change after validation
      // while this batch is being written.
      const lockedEquipment = await tx.$queryRaw<Array<{ id: number }>>`
        SELECT "id"
        FROM "Equipment"
        WHERE "id" IN (${Prisma.join(ids)})
        ORDER BY "id"
        FOR UPDATE
      `

      if (lockedEquipment.length !== ids.length) {
        throw new ValidationError("Uno o más equipos ya no existen.")
      }

      const equipment = await tx.equipment.findMany({
        where: {
          id: {
            in: ids,
          },
        },
        select: {
          id: true,
          company: true,
          type: true,
        },
      })

      if (
        equipment.length !== ids.length ||
        equipment.some(
          (item) =>
            (item.company !== "ORM" && item.company !== "GP2") ||
            (item.type !== "LAPTOP" && item.type !== "DESKTOP"),
        )
      ) {
        throw new ValidationError(
          "Solo se permiten equipos ORM o GP2 de tipo laptop o desktop.",
        )
      }

      const existing = await tx.maintenance.findMany({
        where: {
          equipmentId: {
            in: ids,
          },
          maintenanceDate,
        },
        select: {
          equipmentId: true,
        },
      })

      if (existing.length > 0) {
        throw new ConflictError(
          "Uno o más equipos ya tienen un mantenimiento registrado en esa fecha.",
        )
      }

      const batch = await tx.maintenanceBatch.create({
        data: {},
        select: {
          id: true,
        },
      })

      const created = await tx.maintenance.createMany({
        data: ids.map((equipmentId) => ({
          equipmentId,
          maintenanceDate,
          batchId: batch.id,
          provider,
          notes,
        })),
      })

      if (created.count !== ids.length) {
        throw new BusinessError(
          "No se pudieron guardar todos los mantenimientos seleccionados.",
        )
      }

      return {
        batchId: batch.id,
        count: created.count,
      }
    })
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ConflictError(
        "Uno o más equipos ya tienen un mantenimiento registrado en esa fecha.",
      )
    }

    throw error
  }
}
