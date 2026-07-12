export const employeeInclude = {
  assignments: {
    include: {
      equipment: true,
    },
    orderBy: {
      assignedAt: "desc",
    },
  },
} as const
