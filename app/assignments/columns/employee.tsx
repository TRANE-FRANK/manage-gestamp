"use client"

import type { ColumnDef } from "@tanstack/react-table"

import { DataTableColumnHeader } from "@/components/ui/data-table/DataTableColumnHeader"

import type { AssignmentListItem } from "@/services/assignment"

export const employeeColumn: ColumnDef<AssignmentListItem> = {
  id: "employee",
  accessorFn: (row) => `${row.employee.firstName} ${row.employee.lastName}`,
  header: ({ column }) => (
    <DataTableColumnHeader column={column} title="Empleado" />
  ),
  cell: ({ row }) => (
    <div>
      <p className="font-medium">
        {row.original.employee.firstName} {row.original.employee.lastName}
      </p>

      <p className="text-sm text-muted-foreground">
        SAP: {row.original.employee.sapNumber}
      </p>
    </div>
  ),
  meta: { title: "Empleado" },
}
