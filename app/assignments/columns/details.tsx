"use client"

import Link from "next/link"

import { Eye } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"

import type { AssignmentListItem } from "@/services/assignment"

export const detailsColumn: ColumnDef<AssignmentListItem> = {
  id: "details",

  header: () => "Acciones",

  enableSorting: false,

  cell: ({ row }) => (
    <Button size="icon" variant="outline">
      <Link href={`/assignments/${row.original.id}`}>
        <Eye className="size-4" />
      </Link>
    </Button>
  ),

  meta: {
    title: "Acciones",
  },
}
