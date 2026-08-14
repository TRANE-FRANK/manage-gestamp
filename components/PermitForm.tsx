"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"

import { createPermit } from "@/actions/permit-actions"

interface SearchOption {
  value: string
  label: string
  description?: string
}

interface EquipmentOption {
  value: string
  label: string
  description?: string
}

interface PermitFormProps {
  employeeOptions: SearchOption[]
}

interface EquipmentResponse {
  equipment: {
    id: number
    assetTag: string
    brand: string | null
    model: string | null
    serialNumber: string | null
  }[]
}

export default function PermitForm({ employeeOptions }: PermitFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [employee, setEmployee] = useState<SearchOption | null>(null)

  const [equipmentOptions, setEquipmentOptions] = useState<EquipmentOption[]>(
    [],
  )

  const [equipment, setEquipment] = useState<EquipmentOption | null>(null)

  const [loadingEquipment, setLoadingEquipment] = useState(false)

  function handleEmployeeChange(value: SearchOption | null) {
    setEmployee(value)
    setEquipment(null)
    setEquipmentOptions([])
  }

  useEffect(() => {
    if (!employee) {
      return
    }

    const employeeId = employee.value

    async function loadEquipment() {
      setLoadingEquipment(true)

      try {
        const response = await fetch(`/api/employees/${employeeId}/equipment`)

        if (!response.ok) {
          throw new Error("No se pudieron obtener los equipos.")
        }

        const data: EquipmentResponse = await response.json()

        const options: EquipmentOption[] = data.equipment.map((item) => ({
          value: String(item.id),
          label: item.assetTag,
          description: [
            item.brand,
            item.model,
            item.serialNumber ? `Serie: ${item.serialNumber}` : null,
          ]
            .filter(Boolean)
            .join(" · "),
        }))

        setEquipmentOptions(options)
      } catch (error) {
        console.error("Error al cargar equipos:", error)

        setEquipmentOptions([])
      } finally {
        setLoadingEquipment(false)
      }
    }

    loadEquipment()
  }, [employee])

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()

        const formData = new FormData(event.currentTarget)

        startTransition(async () => {
          const result = await createPermit(formData)

          if (result.success) {
            toast.success("Permiso creado correctamente.")

            router.push("/permits")
            router.refresh()

            return
          }

          toast.error(result.message)
        })
      }}
      className="space-y-6"
    >
      <div className="space-y-2">
        <label htmlFor="folio" className="text-sm font-medium">
          Folio
        </label>

        <input
          id="folio"
          name="folio"
          placeholder="SI-PERMISO-551"
          required
          className="w-full rounded-lg border border-input bg-background px-4 py-3 outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Empleado</label>

        <Combobox
          items={employeeOptions}
          value={employee}
          onValueChange={handleEmployeeChange}
          itemToStringValue={(item) => item?.label ?? ""}
        >
          <ComboboxInput
            placeholder="Buscar empleado..."
            aria-label="Buscar empleado"
            showClear
          />

          <ComboboxContent>
            <ComboboxEmpty>No se encontraron empleados.</ComboboxEmpty>

            <ComboboxList>
              {(item: SearchOption) => (
                <ComboboxItem key={item.value} value={item}>
                  <div className="flex flex-col">
                    <span className="font-medium">{item.label}</span>

                    {item.description && (
                      <span className="text-xs text-muted-foreground">
                        {item.description}
                      </span>
                    )}
                  </div>
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>

        <input type="hidden" name="employeeId" value={employee?.value ?? ""} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Equipo</label>

        <Combobox
          items={equipmentOptions}
          value={equipment}
          onValueChange={setEquipment}
          itemToStringValue={(item) => item?.label ?? ""}
          disabled={
            !employee || loadingEquipment || equipmentOptions.length === 0
          }
        >
          <ComboboxInput
            placeholder={
              !employee
                ? "Seleccione primero un empleado"
                : loadingEquipment
                  ? "Cargando equipos..."
                  : equipmentOptions.length === 0
                    ? "El empleado no tiene equipos asignados"
                    : "Buscar equipo..."
            }
            aria-label="Buscar equipo"
            showClear
          />

          <ComboboxContent>
            <ComboboxEmpty>No se encontraron equipos.</ComboboxEmpty>

            <ComboboxList>
              {(item: EquipmentOption) => (
                <ComboboxItem key={item.value} value={item}>
                  <div className="flex flex-col">
                    <span className="font-medium">{item.label}</span>

                    {item.description && (
                      <span className="text-xs text-muted-foreground">
                        {item.description}
                      </span>
                    )}
                  </div>
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>

        <input
          type="hidden"
          name="equipmentId"
          value={equipment?.value ?? ""}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="startDate" className="text-sm font-medium">
            Fecha de inicio
          </label>

          <input
            id="startDate"
            type="date"
            name="startDate"
            required
            className="w-full rounded-lg border border-input bg-background px-4 py-3 outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="expirationDate" className="text-sm font-medium">
            Fecha de vencimiento
          </label>

          <input
            id="expirationDate"
            type="date"
            name="expirationDate"
            required
            className="w-full rounded-lg border border-input bg-background px-4 py-3 outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending || !employee || !equipment}
        className="rounded-lg bg-primary px-4 py-2 text-primary-foreground transition hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
      >
        {isPending ? "Guardando..." : "Guardar permiso"}
      </button>
    </form>
  )
}
