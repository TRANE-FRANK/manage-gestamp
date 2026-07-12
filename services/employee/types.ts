import type { Prisma } from "@/generated/prisma/client"

import { employeeInclude } from "./queries"

export type EmployeeDetails = Prisma.EmployeeGetPayload<{
  include: typeof employeeInclude
}>
