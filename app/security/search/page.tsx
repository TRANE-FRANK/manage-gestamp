import { requirePageRole } from "@/lib/auth/page-guard"

import SecuritySearchResult from "./SecuritySearchResult"

export default async function SecuritySearchPage() {
  await requirePageRole("ADMIN", "IT", "SECURITY")

  return <SecuritySearchResult />
}
