"use client"

import type { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"

import { CancelPermitButton } from "../[id]/CancelPermitButton"

import type { PermitRow } from "../permit-table-types"

export const permitActionsColumn: ColumnDef<PermitRow> = {
  id: "actions",
  header: "Acciones",
  enableSorting: false,
  enableHiding: false,

  cell: ({ row }) => {
    const permit = row.original

    return (
      <div className="flex flex-wrap gap-2">
        {permit.status !== "CANCELLED" && (
          <Link
            href={`/permits/${permit.id}/renew`}
            className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Renovar
          </Link>
        )}

        {permit.status === "ACTIVE" && (
          <CancelPermitButton permitId={permit.id} />
        )}
      </div>
    )
  },

  meta: {
    title: "Acciones",
  },
}
