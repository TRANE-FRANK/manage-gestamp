import Table from "@/components/ui/Table"

import AssignmentRow from "./AssignmentRow"

import type { AssignmentDetails } from "@/services/assignment"

interface Props {
  assignments: AssignmentDetails[]
}

export default function AssignmentTable({ assignments }: Props) {
  return (
    <Table
      data={assignments}
      emptyMessage="No existen asignaciones activas."
      headers={
        <>
          <th className="p-4 text-left font-semibold">Empleado</th>
          <th className="p-4 text-left font-semibold">Equipo</th>
          <th className="p-4 text-left font-semibold">Empresa</th>
          <th className="p-4 text-left font-semibold">Fecha</th>
          <th className="p-4 text-left font-semibold">Estado</th>
          <th className="p-4 text-left font-semibold">Documento</th>
        </>
      }
      renderRow={(assignment) => (
        <AssignmentRow key={assignment.id} assignment={assignment} />
      )}
    />
  )
}
