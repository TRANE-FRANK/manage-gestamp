import "dotenv/config"

import { PrismaClient, Company } from "../../generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { seedLocations } from "./locations"
import { seedEmployees } from "./employees"

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({
  adapter,
})

const departments = [
  "Calidad",
  "Compras",
  "Dirección",
  "Finanzas",
  "Ingeniería",
  "Logística",
  "Mantenimiento",
  "Matricería",
  "Producción",
  "Recursos Humanos",
  "Sistemas",
]

async function main() {
  console.log("Iniciando seed de departamentos...")

  for (const name of departments) {
    await prisma.department.upsert({
      where: {
        company_name: {
          company: Company.GP2,
          name,
        },
      },
      update: {
        isActive: true,
      },
      create: {
        name,
        company: Company.GP2,
        isActive: true,
      },
    })

    console.log(`Departamento procesado: ${name}`)
  }

  const total = await prisma.department.count({
    where: {
      company: Company.GP2,
    },
  })

  console.log(`\nDepartamentos GP2 registrados: ${total}`)

  await seedLocations(prisma)
    await seedEmployees(prisma)
}

main()
  .catch((error) => {
    console.error("Error ejecutando seed:", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
