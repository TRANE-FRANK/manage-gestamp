export function formatDate(date: Date | null | undefined, locale = "es-MX") {
  if (!date) return "—"

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date))
}
