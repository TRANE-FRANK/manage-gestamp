export interface RenewPermitInput {
  permitId: number
  startDate: Date
  expirationDate: Date
}

export type PermitProcess =
  | "pending-generation"
  | "pending-signature"
  | "exception-authorized"
  | "complete"

export interface ListPermitsInput {
  page?: number
  pageSize?: number
  status?: string
  process?: PermitProcess
  search?: string
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
