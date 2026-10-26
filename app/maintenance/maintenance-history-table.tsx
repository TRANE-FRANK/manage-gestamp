import Link from "next/link"

import type { MaintenanceHistoryRecord } from "@/services/maintenance"

export function formatMaintenanceDate(date: Date) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(date)
}

function getEquipmentIdentifiers(record: MaintenanceHistoryRecord) {
  const equipment = record.equipment
  const primary =
    equipment.inventoryNumber ??
    equipment.assetTag ??
    equipment.serialNumber ??
    equipment.barcode ??
    `Equipo #${equipment.id}`
  const secondary = [
    equipment.assetTag,
    equipment.serialNumber,
    equipment.barcode,
  ].filter((value): value is string => Boolean(value) && value !== primary)
  const description = [...new Set([equipment.brand, equipment.model].filter(Boolean))]

  return { primary, secondary, description }
}

function EquipmentIdentifier({ record }: { record: MaintenanceHistoryRecord }) {
  const { primary, secondary, description } = getEquipmentIdentifiers(record)

  return (
    <div className="min-w-48">
      <Link
        href={`/equipment/${record.equipment.id}`}
        className="font-semibold text-blue-700 underline-offset-2 hover:underline focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700"
      >
        {primary}
      </Link>
      {secondary.length > 0 ? (
        <p className="mt-1 break-all text-xs text-slate-500">
          {secondary.map((value, index) => (
            <span key={`${value}-${index}`}>
              {index > 0 ? " · " : ""}
              {value}
            </span>
          ))}
        </p>
      ) : null}
      {description.length > 0 ? (
        <p className="mt-1 text-xs text-slate-600">{description.join(" ")}</p>
      ) : null}
    </div>
  )
}

function MaintenanceNotes({ notes }: { notes: string | null }) {
  if (!notes) return <span className="text-slate-400">—</span>

  return (
    <details className="max-w-sm whitespace-normal">
      <summary
        title={notes}
        className="max-w-sm cursor-pointer break-words text-slate-700 marker:text-slate-400"
      >
        {notes.length > 120 ? `${notes.slice(0, 120)}…` : notes}
      </summary>
      <p className="mt-2 max-w-sm whitespace-pre-wrap break-words text-slate-600">
        {notes}
      </p>
    </details>
  )
}

export default function MaintenanceHistoryTable({
  records,
  emptyMessage,
}: {
  records: MaintenanceHistoryRecord[]
  emptyMessage?: string
}) {
  if (records.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 p-5 text-sm text-slate-500">
        {emptyMessage ?? "No hay mantenimientos registrados."}
      </p>
    )
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {records.map((record) => (
          <article key={record.id} className="space-y-3 rounded-xl border border-slate-200 p-4">
            <EquipmentIdentifier record={record} />
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="text-xs text-slate-500">Fecha efectiva</dt>
                <dd className="font-medium">{formatMaintenanceDate(record.maintenanceDate)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Proveedor</dt>
                <dd>{record.provider ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Folio</dt>
                <dd className="break-words">{record.folio ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Lote</dt>
                <dd>{record.batch ? `Lote #${record.batch.id}` : "Sin lote (histórico)"}</dd>
              </div>
              <div className="col-span-2">
                <dt className="mb-1 text-xs text-slate-500">Notas</dt>
                <dd><MaintenanceNotes notes={record.notes} /></dd>
              </div>
            </dl>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 md:block">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th scope="col" className="px-4 py-3">Equipo e identificadores</th>
              <th scope="col" className="whitespace-nowrap px-4 py-3">Fecha efectiva</th>
              <th scope="col" className="px-4 py-3">Proveedor</th>
              <th scope="col" className="px-4 py-3">Folio</th>
              <th scope="col" className="px-4 py-3">Notas</th>
              <th scope="col" className="px-4 py-3">Lote</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {records.map((record) => (
              <tr key={record.id} className="align-top hover:bg-slate-50">
                <td className="px-4 py-3"><EquipmentIdentifier record={record} /></td>
                <td className="whitespace-nowrap px-4 py-3">{formatMaintenanceDate(record.maintenanceDate)}</td>
                <td className="max-w-48 whitespace-normal break-words px-4 py-3">{record.provider ?? "—"}</td>
                <td className="max-w-40 whitespace-normal break-words px-4 py-3">{record.folio ?? "—"}</td>
                <td className="max-w-sm whitespace-normal px-4 py-3"><MaintenanceNotes notes={record.notes} /></td>
                <td className="whitespace-nowrap px-4 py-3">{record.batch ? `Lote #${record.batch.id}` : "Sin lote (histórico)"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
