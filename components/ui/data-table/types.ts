import type { ReactNode } from "react"

import type {
  ColumnDef,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table"

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  toolbarPlaceholder?: string
  emptyMessage?: ReactNode
  pageSize?: number
  className?: string
}

export type DataTableSorting = SortingState

export type DataTableVisibility = VisibilityState