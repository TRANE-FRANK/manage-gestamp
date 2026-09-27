"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function EquipmentToast() {
  const searchParams = useSearchParams();
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current) return;

    const created = searchParams.get("created");
    const updated = searchParams.get("updated");

    if (created === "true") {
      shown.current = true;

      toast.success("Equipo registrado correctamente");
    } else if (updated === "true") {
      shown.current = true;

      toast.success("Equipo actualizado correctamente");
    }
  }, [searchParams]);

  return null;
}
