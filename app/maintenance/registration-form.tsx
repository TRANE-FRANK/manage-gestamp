"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

import { registerMaintenanceBatchAction } from "@/actions/maintenance-actions"
import type { MaintenanceRegistrationState } from "@/actions/maintenance-actions"
import type { MaintenanceEquipmentOption } from "@/services/maintenance"

const initialState: MaintenanceRegistrationState = {}

function getEquipmentLabel(equipment: MaintenanceEquipmentOption) {
  return (
    equipment.assetTag ??
    equipment.inventoryNumber ??
    equipment.serialNumber ??
    `Equipo #${equipment.id}`
  )
}

function getEquipmentIdentifiers(equipment: MaintenanceEquipmentOption) {
  return [
    equipment.assetTag ? `Etiqueta: ${equipment.assetTag}` : null,
    equipment.inventoryNumber
      ? `Inventario: ${equipment.inventoryNumber}`
      : null,
    equipment.serialNumber ? `Serie: ${equipment.serialNumber}` : null,
  ].filter((value): value is string => value !== null)
}

export default function MaintenanceRegistrationForm({
  equipment,
  page,
  search,
  company,
  type,
  historyMode,
  lastMaintenanceBefore,
  filterError,
}: {
  equipment: MaintenanceEquipmentOption[]
  page: number
  search: string
  company: string
  type: string
  historyMode: string
  lastMaintenanceBefore: string
  filterError: string | null
}) {
  const [state, formAction, pending] = useActionState(
    registerMaintenanceBatchAction,
    initialState,
  )
  const [selected, setSelected] = useState(
    () => new Map<number, MaintenanceEquipmentOption>(),
  )
  const [searchValue, setSearchValue] = useState(search)
  const [companyValue, setCompanyValue] = useState(company)
  const [typeValue, setTypeValue] = useState(type)
  const [historyModeValue, setHistoryModeValue] = useState(historyMode)
  const [lastMaintenanceBeforeValue, setLastMaintenanceBeforeValue] = useState(
    lastMaintenanceBefore,
  )
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    setSearchValue(search)
    setCompanyValue(company)
    setTypeValue(type)
    setHistoryModeValue(historyMode)
    setLastMaintenanceBeforeValue(lastMaintenanceBefore)
  }, [search, company, type, historyMode, lastMaintenanceBefore])

  useEffect(() => {
    if (!state.success || !state.batchId) {
      return
    }

    toast.success(state.message ?? "Mantenimientos registrados correctamente.")
    formRef.current?.reset()
    setSelected(new Map())
    setSearchValue("")
    router.replace("/maintenance")
    router.refresh()
  }, [state.batchId, state.message, state.success, router])

  function handleSearch(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    const values = {
      search: searchValue.trim(),
      equipmentCompany: companyValue,
      equipmentType: typeValue,
      equipmentHistory: historyModeValue,
      equipmentLastDate: lastMaintenanceBeforeValue,
    }

    for (const [key, value] of Object.entries(values)) {
      if (value && !(key.startsWith("equipment") && value === "all")) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    }

    params.delete("page")
    router.push(`/maintenance?${params.toString()}`)
  }

  function toggleEquipment(item: MaintenanceEquipmentOption, checked: boolean) {
    setSelected((current) => {
      const next = new Map(current)

      if (checked) {
        next.set(item.id, item)
      } else {
        next.delete(item.id)
      }

      return next
    })
  }

  function removeSelectedEquipment(id: number) {
    setSelected((current) => {
      const next = new Map(current)
      next.delete(id)
      return next
    })
  }

  return (
    <div className="space-y-8">
      <section aria-labelledby="maintenance-equipment-heading">
        <h2
          id="maintenance-equipment-heading"
          className="mb-3 text-lg font-semibold text-slate-900"
        >
          Seleccionar equipos
        </h2>

        <form
          onSubmit={handleSearch}
          className="mb-4 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2 xl:grid-cols-[minmax(18rem,2fr)_repeat(3,minmax(10rem,1fr))_minmax(12rem,1.2fr)_auto]"
        >
          <div className="sm:col-span-2 xl:col-span-1">
            <label htmlFor="maintenance-search" className="sr-only">
              Buscar por inventario, etiqueta patrimonial o número de serie
            </label>
            <input
              id="maintenance-search"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Buscar por inventario, etiqueta o número de serie..."
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <label className="text-xs font-medium text-slate-600">
            Empresa
            <select
              value={companyValue}
              onChange={(event) => setCompanyValue(event.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-blue-500"
            >
              <option value="all">Todas</option>
              <option value="ORM">ORM</option>
              <option value="GP2">GP2</option>
            </select>
          </label>
          <label className="text-xs font-medium text-slate-600">
            Tipo de equipo
            <select
              value={typeValue}
              onChange={(event) => setTypeValue(event.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-blue-500"
            >
              <option value="all">Todos los permitidos</option>
              <option value="LAPTOP">Laptop</option>
              <option value="DESKTOP">Desktop</option>
            </select>
          </label>
          <label className="text-xs font-medium text-slate-600">
            Historial
            <select
              value={historyModeValue}
              onChange={(event) => setHistoryModeValue(event.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-blue-500"
            >
              <option value="all">Todos los equipos</option>
              <option value="none">Sin mantenimientos</option>
              <option value="last-before">
                Último mantenimiento hasta fecha
              </option>
            </select>
          </label>
          {historyModeValue === "last-before" ? (
            <label className="text-xs font-medium text-slate-600">
              Último mantenimiento hasta
              <input
                type="date"
                required
                value={lastMaintenanceBeforeValue}
                onChange={(event) =>
                  setLastMaintenanceBeforeValue(event.target.value)
                }
                className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-blue-500"
              />
            </label>
          ) : (
            <div className="hidden xl:block" />
          )}
          <button
            type="submit"
            className="h-10 self-end rounded-lg bg-blue-700 px-4 text-sm font-medium text-white transition hover:bg-blue-800"
          >
            Aplicar filtros
          </button>
        </form>

        {filterError ? (
          <p role="alert" className="mb-3 text-sm text-red-700">
            {filterError}
          </p>
        ) : null}

        {equipment.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 p-5 text-sm text-slate-500">
            No hay equipos que coincidan con los filtros actuales.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th scope="col" className="w-12 px-4 py-3">
                    <span className="sr-only">Seleccionar</span>
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Equipo
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Tipo
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Identificadores
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Empresa
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {equipment.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(item.id)}
                        onChange={(event) =>
                          toggleEquipment(item, event.target.checked)
                        }
                        aria-label={`Seleccionar ${getEquipmentLabel(item)}`}
                        className="size-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {getEquipmentLabel(item)}
                      {item.brand || item.model ? (
                        <span className="mt-1 block font-normal text-slate-500">
                          {[item.brand, item.model].filter(Boolean).join(" ")}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      {item.type === "LAPTOP" ? "Laptop" : "Desktop"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {getEquipmentIdentifiers(item).join(" · ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{item.company}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-2 text-sm text-slate-500">
          La selección se conserva al buscar o cambiar de página. Página {page}.
        </p>
      </section>

      <section aria-labelledby="maintenance-selected-heading">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2
            id="maintenance-selected-heading"
            className="text-lg font-semibold text-slate-900"
          >
            Equipos seleccionados ({selected.size})
          </h2>
          {selected.size > 0 && (
            <button
              type="button"
              onClick={() => setSelected(new Map())}
              className="text-sm font-medium text-blue-700 hover:underline"
            >
              Limpiar selección
            </button>
          )}
        </div>

        {selected.size === 0 ? (
          <p className="text-sm text-slate-500">
            Selecciona únicamente los equipos que recibieron el servicio.
          </p>
        ) : (
          <ul className="space-y-2">
            {Array.from(selected.values()).map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {getEquipmentLabel(item)}
                  </p>
                  <p className="text-sm text-slate-500">
                    {[...getEquipmentIdentifiers(item), item.company]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeSelectedEquipment(item.id)}
                  className="text-sm font-medium text-red-700 hover:underline"
                  aria-label={`Quitar ${getEquipmentLabel(item)} de la selección`}
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form
        ref={formRef}
        action={formAction}
        className="space-y-5 border-t border-slate-200 pt-6"
      >
        {Array.from(selected.keys()).map((id) => (
          <input key={id} type="hidden" name="equipmentIds" value={id} />
        ))}

        <h2 className="text-lg font-semibold text-slate-900">
          Datos del mantenimiento
        </h2>

        {state.message && (
          <div
            role={state.success ? "status" : "alert"}
            className={`rounded-lg border p-3 text-sm ${
              state.success
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {state.message}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label
              htmlFor="maintenance-date"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Fecha efectiva del mantenimiento
            </label>
            <input
              id="maintenance-date"
              type="date"
              name="maintenanceDate"
              required
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label
              htmlFor="maintenance-provider"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Proveedor{" "}
              <span className="font-normal text-slate-500">(opcional)</span>
            </label>
            <input
              id="maintenance-provider"
              name="provider"
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="maintenance-notes"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Notas <span className="font-normal text-slate-500">(opcional)</span>
          </label>
          <textarea
            id="maintenance-notes"
            name="notes"
            rows={3}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={pending || selected.size === 0}
            className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending
              ? "Guardando..."
              : `Registrar ${selected.size || ""} mantenimiento${selected.size === 1 ? "" : "s"}`}
          </button>
        </div>
      </form>
    </div>
  )
}
