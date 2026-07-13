"use client"

import * as React from "react"

import type { EmployeeOption, EquipmentOption } from "./types"

import { createAssignmentAction } from "@/actions/assignment-actions"

import EmployeeSelector from "./EmployeeSelector"
import EquipmentSelector from "./EquipmentSelector"

interface AssignmentFormProps {
  employees: EmployeeOption[]
  equipment: EquipmentOption[]
  employeeId?: string
}

export default function AssignmentForm({
  employees,
  equipment,
  employeeId,
}: AssignmentFormProps) {
  const initialEmployee =
    employees.find((e) => e.id === Number(employeeId)) ?? null

  const [selectedEmployee, setSelectedEmployee] =
    React.useState<EmployeeOption | null>(initialEmployee)

  const [selectedEquipment, setSelectedEquipment] =
    React.useState<EquipmentOption | null>(null)

  return (
    <form action={createAssignmentAction} className="space-y-6">
      <input
        type="hidden"
        name="employeeId"
        value={selectedEmployee?.id ?? ""}
      />

      <input
        type="hidden"
        name="equipmentId"
        value={selectedEquipment?.id ?? ""}
      />

      <div>
        <label className="mb-2 block text-sm font-medium">
          Empleado
        </label>

        <EmployeeSelector
          employees={employees}
          value={selectedEmployee}
          onValueChange={setSelectedEmployee}
          disabled={!!employeeId}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          Equipo
        </label>

        <EquipmentSelector
          equipment={equipment}
          value={selectedEquipment}
          onValueChange={setSelectedEquipment}
        />
      </div>

      <button
        type="submit"
        className="rounded-lg bg-black px-4 py-2 text-white"
      >
        Guardar asignación
      </button>
    </form>
  )
}