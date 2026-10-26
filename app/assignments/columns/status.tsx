"use client"

import type { ColumnDef } from "@tanstack/react-table"

import AssignmentStatus from "@/components/assignment/AssignmentStatus"
import { DataTableColumnHeader } from "@/components/ui/data-table/DataTableColumnHeader"
import { formatDate } from "@/lib/format-date"

import type { AssignmentListItem } from "@/services/assignment"

export const statusColumn: ColumnDef<AssignmentListItem> = {
  id: "status",
  header: ({ column }) => (
    <DataTableColumnHeader column={column} title="Estado" />
  ),
  cell: ({ row }) => {
    const assignment = row.original

    return (
      <div className="space-y-1">
        <AssignmentStatus
          returnedAt={assignment.returnedAt}
          cancelledAt={assignment.cancelledAt}
        />

        {assignment.cancelledAt && (
          <>
            <p className="text-xs text-muted-foreground">
              Anulada: {formatDate(assignment.cancelledAt)}
            </p>

            <p className="text-xs text-muted-foreground">
              Motivo: {assignment.cancellationReason}
            </p>
          </>
        )}
      </div>
    )
  },
  meta: { title: "Estado" },
}
