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
  authorizePermitDeparture,
  listPermitsPaginated
} from "./service"

export { calculateDaysRemaining, getPermitDisplayStatus } from "./utils"

export type { RenewPermitInput, PermitProcess} from "./types"

export type { PermitDisplayStatus } from "./utils"

export * from "./document"
