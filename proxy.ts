import { NextResponse } from "next/server"

import { auth } from "@/auth"
import {
  getPageAccessDecision,
  getRoleHomePath,
  sanitizeCallbackUrl,
} from "@/lib/auth/page-policy"

export default auth((request) => {
  const pathname = request.nextUrl.pathname
  const role = request.auth?.user?.role
  const decision = getPageAccessDecision(pathname, role)

  if (decision === "public" || decision === "allowed") {
    return NextResponse.next()
  }

  if (decision === "unauthenticated") {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set(
      "callbackUrl",
      sanitizeCallbackUrl(`${pathname}${request.nextUrl.search}`),
    )
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.redirect(
    new URL(getRoleHomePath(role), request.url),
  )
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
}
