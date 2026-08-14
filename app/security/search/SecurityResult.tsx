"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

const RESULT_DELAY = 5

export default function SecurityResult() {
  const router = useRouter()

  const [seconds, setSeconds] = useState(RESULT_DELAY)

  useEffect(() => {
    const countdown = setInterval(() => {
      setSeconds((current) => {
        if (current <= 1) {
          clearInterval(countdown)
          return 0
        }

        return current - 1
      })
    }, 1000)

    const redirect = setTimeout(() => {
      router.replace("/security")
    }, RESULT_DELAY * 1000)

    return () => {
      clearInterval(countdown)
      clearTimeout(redirect)
    }
  }, [router])

  return (
    <p className="mt-3 text-center text-lg text-slate-500">
      Regresando al escáner en{" "}
      <span className="font-semibold text-slate-900">{seconds}</span>{" "}
      {seconds === 1 ? "segundo" : "segundos"}...
    </p>
  )
}
