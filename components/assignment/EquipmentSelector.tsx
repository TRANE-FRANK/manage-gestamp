"use client"

import type { EquipmentOption } from "./types"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"

interface EquipmentSelectorProps {
  equipment: EquipmentOption[]
  value: EquipmentOption | null
  onValueChange: (value: EquipmentOption | null) => void
  disabled?: boolean
}

export default function EquipmentSelector({
  equipment,
  value,
  onValueChange,
  disabled = false,
}: EquipmentSelectorProps) {
  return (
    <Combobox<EquipmentOption>
      items={equipment}
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      itemToStringValue={(item) => item.label}
    >
      <ComboboxInput placeholder="Buscar equipo..." disabled={disabled} />

      <ComboboxContent>
        <ComboboxEmpty>No se encontraron equipos.</ComboboxEmpty>

        <ComboboxList>
          {(item: EquipmentOption) => (
            <ComboboxItem key={item.id} value={item}>
              <div className="flex flex-col">
                <span className="font-medium">{item.label}</span>

                {item.description && (
                  <span className="text-xs text-muted-foreground">
                    {item.description}
                  </span>
                )}
              </div>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
