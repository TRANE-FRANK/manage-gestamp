"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export type ScanResultPayload = {
  allowed: boolean
  result: "ALLOWED" | "DENIED"
  message: string
  equipment: {
    id?: number
    assetTag: string
    company: string
  } | null
  permit: {
    id?: number
    folio: string
    status: "ACTIVE" | "EXPIRED" | "CANCELLED"
    startDate: string
    expirationDate: string
    cancelledAt?: string | null
    cancellationReason?: string | null
    employee: {
      firstName: string
      lastName: string
      department?: string | null
    }
  } | null
}

type ScanResultContextValue = {
  result: ScanResultPayload | null
  setResult: (result: ScanResultPayload | null) => void
  searchedAssetTag: string | null
  setSearchedAssetTag: (assetTag: string | null) => void
}

const ScanResultContext = createContext<ScanResultContextValue | null>(null)

export function ScanResultProvider({ children }: { children: ReactNode }) {
  const [result, setResult] = useState<ScanResultPayload | null>(null)
  const [searchedAssetTag, setSearchedAssetTag] = useState<string | null>(null)

  return (
    <ScanResultContext.Provider
      value={{ result, setResult, searchedAssetTag, setSearchedAssetTag }}
    >
      {children}
    </ScanResultContext.Provider>
  )
}

export function useScanResult() {
  const value = useContext(ScanResultContext)
  if (!value) {
    throw new Error("useScanResult debe usarse dentro de ScanResultProvider.")
  }
  return value
}
