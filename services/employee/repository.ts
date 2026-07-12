import { prisma } from "@/lib/prisma"

import { NotFoundError } from "../shared/errors"

import { employeeInclude } from "./queries"

export async function findEmployees() {
  return prisma.employee.findMany({
    orderBy: {
      firstName: "asc",
    },
  })
}

export async function findEmployeeById(id: number) {
  return prisma.employee.findUnique({
    where: {
      id,
    },

    include: employeeInclude,
  })
}

export async function findEmployeeByIdOrThrow(id: number) {
  const employee = await findEmployeeById(id)

  if (!employee) {
    throw new NotFoundError("El empleado no existe.")
  }

  return employee
}
