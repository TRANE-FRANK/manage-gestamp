export {
  listPermits,
  getPermitDetails,
  getPermitByFolio,
  createPermit,
  renewPermit,
  cancelPermit,
  authorizeExceptionalDeparture,
  uploadSignedPermitPdf,
  setPermitDepartureAuthorization,
} from "./service"

export { calculateDaysRemaining, getPermitDisplayStatus } from "./utils"

export type { RenewPermitInput } from "./types"

export type { PermitDisplayStatus } from "./utils"

export * from "./document"
