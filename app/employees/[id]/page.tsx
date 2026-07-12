import PageHeader from "@/components/ui/PageHeader"

import EmployeeInformationCard from "@/components/employee/EmployeeInformationCard"
import EmployeeCurrentEquipmentCard from "@/components/employee/EmployeeCurrentEquipmentCard"

import { getEmployeeDetails } from "@/services/employee"

interface Props {
  params: Promise<{
    id: string
  }>
}

export default async function EmployeeDetailsPage({ params }: Props) {
  const { id } = await params

  const employee = await getEmployeeDetails(Number(id))

  return (
    <>
      <PageHeader title={`${employee.firstName} ${employee.lastName}`} />

      <div className="grid gap-6 lg:grid-cols-2">
        <EmployeeInformationCard employee={employee} />

        <EmployeeCurrentEquipmentCard employee={employee} />
      </div>
    </>
  )
}
