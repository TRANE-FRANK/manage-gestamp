import React from "react"

interface TableProps<T> {
  headers: React.ReactNode
  data: T[]
  renderRow: (item: T, index: number) => React.ReactNode
  emptyMessage?: string
}

export default function Table<T>({
  headers,
  data,
  renderRow,
  emptyMessage = "No existen registros.",
}: TableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-slate-50">{headers}</tr>
        </thead>

        <tbody>{data.map((item, index) => renderRow(item, index))}</tbody>
      </table>

      {data.length === 0 && (
        <div className="py-12 text-center text-slate-500">{emptyMessage}</div>
      )}
    </div>
  )
}
