import Table from "@/components/ui/Table"

import AssignmentHistoryRow from "./AssignmentHistoryRow"

import type { AssignmentDetails } from "@/services/assignment"

interface Props {
  assignments: AssignmentDetails[]
}

export default function AssignmentHistoryTable({ assignments }: Props) {
  return (
    <Table
      data={assignments}
      emptyMessage="No existe historial de asignaciones."
      headers={
        <>
          <th className="p-4 text-left font-semibold">Empleado</th>
          <th className="p-4 text-left font-semibold">Equipo</th>
          <th className="p-4 text-left font-semibold">Empresa</th>
          <th className="p-4 text-left font-semibold">Asignado</th>
          <th className="p-4 text-left font-semibold">Devuelto</th>
          <th className="p-4 text-left font-semibold">Estado</th>
          <th className="p-4 text-left font-semibold">Acciones</th>
        </>
      }
      renderRow={(assignment) => (
        <AssignmentHistoryRow key={assignment.id} assignment={assignment} />
      )}
    />
  )
}
