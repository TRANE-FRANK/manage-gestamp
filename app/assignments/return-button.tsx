"use client";

import { useTransition } from "react";
import { returnAssignmentAction } from "@/actions/return-assignment";

export default function ReturnButton({
  assignmentId,
}: {
  assignmentId: number;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() =>
        startTransition(() => returnAssignmentAction(assignmentId))
      }
      className="rounded-lg bg-red-600 px-3 py-2 text-white font-bold"
    >
      Quitar Asignación
    </button>
  );
}
