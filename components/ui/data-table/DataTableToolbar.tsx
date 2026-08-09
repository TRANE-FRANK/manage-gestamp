"use client"

import { Search } from "lucide-react"

import type { Table } from "@tanstack/react-table"

import { Input } from "@/components/ui/input"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  placeholder?: string
}

export function DataTableToolbar<TData>({
  table,
  placeholder = "Buscar...",
}: DataTableToolbarProps<TData>) {
  return (
    <div className="flex w-full items-center">
      <label className="relative w-full md:max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-slate-400" />

        <Input
          value={(table.getState().globalFilter as string) ?? ""}
          onChange={(event) => table.setGlobalFilter(event.target.value)}
          placeholder={placeholder}
          className="pl-8"
        />
      </label>
    </div>
  )
}
