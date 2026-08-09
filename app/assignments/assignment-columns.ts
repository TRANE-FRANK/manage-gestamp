import { actionsColumn } from "./columns/document-actions"
import { assignedAtColumn } from "./columns/assigned-at"
import { companyColumn } from "./columns/company"
import { employeeColumn } from "./columns/employee"
import { equipmentColumn } from "./columns/equipment"
import { statusColumn } from "./columns/status"
import { detailsColumn } from "./columns/details"

export const assignmentColumns = [
  employeeColumn,
  equipmentColumn,
  companyColumn,
  assignedAtColumn,
  statusColumn,
  actionsColumn,
  detailsColumn,
]