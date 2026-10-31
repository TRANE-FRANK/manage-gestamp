export function getDaysUntil(date: Date): number {
  const now = new Date()

  const millisecondsPerDay = 1000 * 60 * 60 * 24

  return Math.ceil((date.getTime() - now.getTime()) / millisecondsPerDay)
}

export function formatMaintenanceDate(date: Date) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(date)
}
