export function calculateDaysRemaining(expirationDate: Date) {
  const now = new Date()

  const difference = expirationDate.getTime() - now.getTime()

  return Math.ceil(difference / (1000 * 60 * 60 * 24))
}

export type PermitDisplayStatus = "active" | "expiring" | "expired"

export function getPermitDisplayStatus(
  expirationDate: Date,
): PermitDisplayStatus {
  const daysLeft = calculateDaysRemaining(expirationDate)

  if (daysLeft < 0) {
    return "expired"
  }

  if (daysLeft <= 30) {
    return "expiring"
  }

  return "active"
}
