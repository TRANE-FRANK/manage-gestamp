"use client"

import { useActionState, useState } from "react"

import {
  createEquipment,
  type EquipmentFormState,
} from "@/actions/equipment-actions"

const initialState: EquipmentFormState = {}

export default function EquipmentForm() {
  const [state, formAction, isPending] = useActionState(
    createEquipment,
    initialState,
  )

  const [equipmentType, setEquipmentType] = useState("")

  const requiresAssetTag =
    equipmentType === "LAPTOP" || equipmentType === "DESKTOP"

  const hasWarranty =
    equipmentType === "LAPTOP" ||
    equipmentType === "DESKTOP" ||
    equipmentType === "TABLET"

  return (
    <form action={formAction} className="space-y-6">
      {state.errors?.general && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {state.errors.general}
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Asset Tag
          <span className="ml-1 text-xs font-normal text-slate-500">
            {requiresAssetTag ? "(Obligatorio)" : "(Opcional)"}
          </span>
        </label>

        <input
          name="assetTag"
          placeholder="GP2LT001"
          className="w-full rounded-xl border border-slate-300 p-3 focus:border-blue-500 focus:outline-none"
          required={requiresAssetTag}
        />

        {state.errors?.assetTag && (
          <p className="mt-1 text-sm text-red-600">{state.errors.assetTag}</p>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Tipo de Equipo
        </label>

        <select
          name="type"
          value={equipmentType}
          onChange={(event) => setEquipmentType(event.target.value)}
          className="w-full rounded-xl border border-slate-300 p-3 focus:border-blue-500 focus:outline-none"
          required
        >
          <option value="">Seleccionar</option>
          <option value="LAPTOP">Laptop</option>
          <option value="DESKTOP">Desktop</option>
          <option value="SMARTPHONE">Smartphone</option>
          <option value="TABLET">Tablet</option>
          <option value="RADIO">Radio</option>
          <option value="PRINTER">Impresora</option>
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Número de Inventario
          </label>

          <input
            name="inventoryNumber"
            placeholder="INV-0001"
            className="w-full rounded-xl border border-slate-300 p-3 focus:border-blue-500 focus:outline-none"
          />

          {state.errors?.inventoryNumber && (
            <p className="mt-1 text-sm text-red-600">
              {state.errors.inventoryNumber}
            </p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Número de Serie
          </label>

          <input
            name="serialNumber"
            placeholder="Serial"
            className="w-full rounded-xl border border-slate-300 p-3 focus:border-blue-500 focus:outline-none"
          />

          {state.errors?.serialNumber && (
            <p className="mt-1 text-sm text-red-600">
              {state.errors.serialNumber}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Marca
          </label>

          <input
            name="brand"
            placeholder="Dell"
            className="w-full rounded-xl border border-slate-300 p-3 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Modelo
          </label>

          <input
            name="model"
            placeholder="Latitude 5440"
            className="w-full rounded-xl border border-slate-300 p-3 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Empresa
          </label>

          <select
            name="company"
            className="w-full rounded-xl border border-slate-300 p-3 focus:border-blue-500 focus:outline-none"
            required
          >
            <option value="ORM">ORM</option>
            <option value="GP2">GP2</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Estado
          </label>

          <select
            name="status"
            className="w-full rounded-xl border border-slate-300 p-3 focus:border-blue-500 focus:outline-none"
            required
          >
            <option value="AVAILABLE">Disponible</option>
            <option value="ASSIGNED">Asignado</option>
            <option value="STORAGE">Almacén</option>
            <option value="MAINTENANCE">Mantenimiento</option>
            <option value="RETIRED">Retirado</option>
          </select>
        </div>
      </div>

      <div
        className={`grid gap-4 ${
          hasWarranty ? "md:grid-cols-2" : "md:grid-cols-1"
        }`}
      >
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Propiedad
          </label>

          <select
            name="ownership"
            className="w-full rounded-xl border border-slate-300 p-3 focus:border-blue-500 focus:outline-none"
            required
          >
            <option value="OWNED">Propio</option>
            <option value="RENTED">Rentado</option>
          </select>
        </div>

        {hasWarranty && (
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Vencimiento de garantía
              <span className="ml-1 text-xs font-normal text-slate-500">
                (Opcional)
              </span>
            </label>

            <input
              type="date"
              name="warrantyExpiresAt"
              className="w-full rounded-xl border border-slate-300 p-3 focus:border-blue-500 focus:outline-none"
            />
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-blue-700 px-6 py-3 font-medium text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Guardando..." : "Guardar Equipo"}
        </button>
      </div>
    </form>
  )
}
