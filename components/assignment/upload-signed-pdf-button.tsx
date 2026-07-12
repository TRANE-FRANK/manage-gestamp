"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { uploadSignedPdfAction } from "@/actions/assignment-document-actions";

export default function UploadSignedPdfButton({
  assignmentId,
}: {
  assignmentId: number;
}) {
  const router = useRouter();

  const inputRef = useRef<HTMLInputElement>(null);

  const [pending, startTransition] = useTransition();

  function openExplorer() {
    inputRef.current?.click();
  }

  function onSelectFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;
    const maxSize = 3 * 1024 * 1024; // 3 MB

    if (file.size > maxSize) {
      toast.error("El archivo excede los 3 MB.");
      event.target.value = "";
      return;
    }

    // Validar tipo
    if (file.type !== "application/pdf") {
      toast.error("Solo se permiten archivos PDF.");
      event.target.value = "";
      return;
    }
    const formData = new FormData();

    formData.append("file", file);

    startTransition(async () => {
      const result = await uploadSignedPdfAction(assignmentId, formData);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success("Responsiva firmada correctamente.");

      router.refresh();
    });

    event.target.value = "";
  }

  return (
    <>
      <button
        disabled={pending}
        onClick={openExplorer}
        className="rounded-lg border border-orange-200 bg-orange-100 px-3 py-2 text-sm font-medium text-orange-700 transition hover:bg-orange-200 disabled:opacity-50"
      >
        {pending ? "Subiendo..." : "Subir PDF firmado"}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        hidden
        onChange={onSelectFile}
      />
    </>
  );
}
