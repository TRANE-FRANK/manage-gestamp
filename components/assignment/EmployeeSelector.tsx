"use client"

import type { EmployeeOption } from "./types"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"

interface EmployeeSelectorProps {
  employees: EmployeeOption[]
  value: EmployeeOption | null
  onValueChange: (value: EmployeeOption | null) => void
  disabled?: boolean
}

export default function EmployeeSelector({
  employees,
  value,
  onValueChange,
  disabled = false,
}: EmployeeSelectorProps) {
  return (
    <Combobox<EmployeeOption>
      items={employees}
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      itemToStringValue={(employee) => employee.label}
    >
      <ComboboxInput placeholder="Buscar empleado..." disabled={disabled} />

      <ComboboxContent>
        <ComboboxEmpty>No se encontraron empleados.</ComboboxEmpty>

        <ComboboxList>
          {(employee: EmployeeOption) => (
            <ComboboxItem key={employee.id} value={employee}>
              <div className="flex flex-col">
                <span className="font-medium">{employee.label}</span>

                {employee.description && (
                  <span className="text-xs text-muted-foreground">
                    {employee.description}
                  </span>
                )}
              </div>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
