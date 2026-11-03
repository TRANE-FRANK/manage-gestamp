import { prisma } from "@/lib/prisma"

export async function getEquipmentFormCatalogs() {
  const [departments, locations] = await Promise.all([
    prisma.department.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        company: true,
      },
      orderBy: [{ company: "asc" }, { name: "asc" }],
    }),

    prisma.location.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        parentId: true,
        company: true,
      },
      orderBy: [{ company: "asc" }, { name: "asc" }],
    }),
  ])

  const locationMap = new Map(
    locations.map((location) => [location.id, location]),
  )

  const locationOptions = locations.map((location) => {
    const path: string[] = []
    let current: (typeof locations)[number] | undefined = location

    while (current) {
      path.unshift(current.name)

      current = current.parentId ? locationMap.get(current.parentId) : undefined
    }

    return {
      id: location.id,
      company: location.company,
      label: path.join(" / "),
    }
  })

  return {
    departments,
    locations: locationOptions,
  }
}
