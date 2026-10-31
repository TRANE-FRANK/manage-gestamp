"use client"

import { useState } from "react"
import Link from "next/link"

import { formatMaintenanceDate } from "@/lib/date"

import type { MaintenanceHistoryRecord } from "@/services/maintenance"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import MaintenanceDocumentAction from "./maintenance-document-action"

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

  const description = [
    ...new Set([equipment.brand, equipment.model].filter(Boolean)),
  ]

  return { primary, secondary, description }
}

function EquipmentIdentifier({ record }: { record: MaintenanceHistoryRecord }) {
  const { primary, secondary, description } = getEquipmentIdentifiers(record)

  return (
    <div className="min-w-0">
      <Link
        href={`/equipment/${record.equipment.id}`}
        className="font-semibold text-blue-700 underline-offset-2 hover:underline focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700"
      >
        {primary}
      </Link>

      {secondary.length > 0 ? (
        <p className="mt-1 break-all text-xs text-slate-500">
          {secondary.join(" · ")}
        </p>
      ) : null}

      {description.length > 0 ? (
        <p className="mt-1 text-xs text-slate-600">{description.join(" ")}</p>
      ) : null}
    </div>
  )
}

function MaintenanceDetail({ record }: { record: MaintenanceHistoryRecord }) {
  const equipment = record.equipment
  const { primary, secondary, description } = getEquipmentIdentifiers(record)

  return (
    <div className="max-h-[65vh] space-y-6 overflow-y-auto pr-1">
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">
          Información del mantenimiento
        </h3>

        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-slate-500">Fecha efectiva</dt>
            <dd className="mt-1 font-medium">
              {formatMaintenanceDate(record.maintenanceDate)}
            </dd>
          </div>

          <div>
            <dt className="text-xs text-slate-500">Proveedor</dt>
            <dd className="mt-1 break-words">{record.provider ?? "—"}</dd>
          </div>

          <div>
            <dt className="text-xs text-slate-500">Folio</dt>
            <dd className="mt-1 break-words">{record.folio ?? "—"}</dd>
          </div>

          <div>
            <dt className="text-xs text-slate-500">Lote relacionado</dt>
            <dd className="mt-1">
              {record.batch
                ? `Lote #${record.batch.id}`
                : "Sin lote (histórico)"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="space-y-3 border-t border-slate-200 pt-4">
        <h3 className="text-sm font-semibold text-slate-900">
          Identificación del equipo
        </h3>

        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-slate-500">Identificador principal</dt>
            <dd className="mt-1 font-medium">{primary}</dd>
          </div>

          <div>
            <dt className="text-xs text-slate-500">Equipo</dt>
            <dd className="mt-1">{description.join(" ") || "—"}</dd>
          </div>

          <div>
            <dt className="text-xs text-slate-500">
              Identificadores adicionales
            </dt>
            <dd className="mt-1 break-all">
              {secondary.length > 0 ? secondary.join(" · ") : "—"}
            </dd>
          </div>

          <div>
            <dt className="text-xs text-slate-500">Número interno</dt>
            <dd className="mt-1">#{equipment.id}</dd>
          </div>
        </dl>

        <Link
          href={`/equipment/${equipment.id}`}
          className="inline-block text-sm font-medium text-blue-700 underline-offset-2 hover:underline"
        >
          Consultar ficha del equipo
        </Link>
      </section>

      <section className="space-y-2 border-t border-slate-200 pt-4">
        <h3 className="text-sm font-semibold text-slate-900">Notas</h3>

        <p className="whitespace-pre-wrap wrap-break-words text-sm leading-6 text-slate-600">
          {record.notes || "Sin notas registradas."}
        </p>
      </section>

      <section className="space-y-3 border-t border-slate-200 pt-4">
        <h3 className="text-sm font-semibold text-slate-900">Documentación</h3>

        <MaintenanceDocumentAction
          maintenanceId={record.id}
          hasGeneratedDocument={Boolean(record.generatedPdfPath)}
          hasSignedDocument={Boolean(record.signedPdfPath)}
        />
      </section>
    </div>
  )
}

function getMaintenanceDocumentStatus(record: MaintenanceHistoryRecord) {
  if (record.signedPdfPath) {
    return {
      label: "Firmado",
      className: "bg-green-100 text-green-800",
    }
  }

  if (record.generatedPdfPath) {
    return {
      label: "Pendiente de firma",
      className: "bg-amber-100 text-amber-800",
    }
  }

  return {
    label: "Sin generar",
    className: "bg-slate-100 text-slate-600",
  }
}

function MaintenanceStatus({ record }: { record: MaintenanceHistoryRecord }) {
  const status = getMaintenanceDocumentStatus(record)

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}
    >
      {status.label}
    </span>
  )
}

export default function MaintenanceHistoryTable({
  records,
  emptyMessage,
}: {
  records: MaintenanceHistoryRecord[]
  emptyMessage?: string
}) {
  const [selectedRecord, setSelectedRecord] =
    useState<MaintenanceHistoryRecord | null>(null)

  if (records.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 p-5 text-sm text-slate-500">
        {emptyMessage ?? "No hay mantenimientos registrados."}
      </p>
    )
  }

  return (
    <>
      {/* Vista móvil */}
      <div className="space-y-3 md:hidden">
        {records.map((record) => (
          <article
            key={record.id}
            className="space-y-3 rounded-xl border border-slate-200 p-4"
          >
            <EquipmentIdentifier record={record} />

            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="text-xs text-slate-500">Fecha efectiva</dt>
                <dd className="font-medium">
                  {formatMaintenanceDate(record.maintenanceDate)}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-slate-500">Proveedor</dt>
                <dd className="break-words">{record.provider ?? "—"}</dd>
              </div>

              <div>
                <dt className="text-xs text-slate-500">Folio</dt>
                <dd className="break-words">{record.folio ?? "—"}</dd>
              </div>
            </dl>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setSelectedRecord(record)}
            >
              Ver detalle
            </Button>
          </article>
        ))}
      </div>

      {/* Vista escritorio */}
      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 md:block">
        <table className="w-full min-w-[750px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th scope="col" className="px-4 py-3">
                Equipo
              </th>
              <th scope="col" className="whitespace-nowrap px-4 py-3">
                Fecha efectiva
              </th>
              <th scope="col" className="px-4 py-3">
                Proveedor
              </th>
              <th scope="col" className="px-4 py-3">
                Folio
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Estado del documento
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Acciones
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {records.map((record) => (
              <tr key={record.id} className="align-middle hover:bg-slate-50">
                <td className="px-4 py-3">
                  <EquipmentIdentifier record={record} />
                </td>

                <td className="whitespace-nowrap px-4 py-3">
                  {formatMaintenanceDate(record.maintenanceDate)}
                </td>

                <td className="max-w-48 whitespace-normal break-words px-4 py-3">
                  {record.provider ?? "—"}
                </td>

                <td className="max-w-40 whitespace-normal break-words px-4 py-3">
                  {record.folio ?? "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <MaintenanceStatus record={record} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedRecord(record)}
                  >
                    Ver detalle
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detalle del mantenimiento */}
      <Dialog
        open={selectedRecord !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedRecord(null)
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-2xl">
          {selectedRecord ? (
            <>
              <DialogHeader>
                <DialogTitle>Detalle del mantenimiento</DialogTitle>

                <DialogDescription>
                  Registro #{selectedRecord.id}
                </DialogDescription>
              </DialogHeader>

              <MaintenanceDetail record={selectedRecord} />
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
