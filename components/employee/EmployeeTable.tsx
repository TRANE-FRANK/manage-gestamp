import Table from "@/components/ui/Table"

import EmployeeRow from "./EmployeeRow"

import type { Employee } from "@/generated/prisma/client"

interface Props {
  employees: Employee[]
}

export default function EmployeeTable({ employees }: Props) {
  return (
    <Table
      data={employees}
      emptyMessage="No hay empleados registrados."
      headers={
        <>
          <th className="p-4 text-left font-semibold">SAP</th>

          <th className="p-4 text-left font-semibold">Nombre</th>

          <th className="p-4 text-left font-semibold">Departamento</th>

          <th className="p-4 text-left font-semibold">Posición</th>

          <th className="p-4 text-left font-semibold">Empresa</th>
        </>
      }
      renderRow={(employee) => (
        <EmployeeRow key={employee.id} employee={employee} />
      )}
    />
  )
}
