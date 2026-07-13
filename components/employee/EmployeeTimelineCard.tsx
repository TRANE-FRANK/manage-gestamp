import SectionCard from "@/components/ui/SectionCard"

import { formatDate } from "@/lib/format-date"

import type { EmployeeDetails } from "@/services/employee"

interface Props {
  employee: EmployeeDetails
}

export default function EmployeeTimelineCard({ employee }: Props) {
  const events = employee.assignments
    .flatMap((assignment) => {
      const events = [
        {
          id: `${assignment.id}-assigned`,
          date: assignment.assignedAt,
          title: "Equipo asignado",
          description: `${assignment.equipment.brand} ${assignment.equipment.model}`,
          color: "bg-emerald-500",
        },
      ]

      if (assignment.returnedAt) {
        events.push({
          id: `${assignment.id}-returned`,
          date: assignment.returnedAt,
          title: "Equipo devuelto",
          description: `${assignment.equipment.brand} ${assignment.equipment.model}`,
          color: "bg-slate-400",
        })
      }

      return events
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <SectionCard title="Timeline">
      {events.length === 0 ? (
        <p className="text-sm text-slate-500">
          No existe actividad para este empleado.
        </p>
      ) : (
        <div className="space-y-6">
          {events.map((event) => (
            <div key={event.id} className="flex gap-4">
              <div className={`mt-2 h-3 w-3 rounded-full ${event.color}`} />

              <div className="flex-1">
                <h3 className="font-medium">{event.title}</h3>

                <p className="text-sm text-slate-600">{event.description}</p>

                <p className="mt-1 text-xs text-slate-400">
                  {formatDate(event.date)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  )
}
