import { ValidationError } from "@/services/shared/errors";
import fs from "fs/promises";
import path from "path";

import { prisma } from "@/lib/prisma";

import { ensureDirectory } from "../shared/storage";

export async function uploadSignedPdf(assignmentId: number, file: File) {
  const assignment = await prisma.assignment.findUnique({
    where: {
      id: assignmentId,
    },
  });

  if (!assignment) {
    throw new Error("Asignación no encontrada.");
  }

  if (!assignment.generatedPdfPath) {
    throw new Error("La responsiva aún no ha sido generada.");
  }

  if (file.type !== "application/pdf") {
    throw new ValidationError("Solo se permiten archivos PDF.");
  }

  if (file.size > 10 * 1024 * 1024) {
    // 3 MB
    throw new ValidationError("El archivo excede los 10 MB.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const directory = await ensureDirectory("assignments/signed");

  /**
   * RESP-123456-2026-06-28_01-48-15.pdf
   */

  const originalName = path.basename(assignment.generatedPdfPath, ".pdf");

  /**
   * RESP-123456-2026-06-28_01-48-15-FIRMADA.pdf
   */

  const signedName = `${originalName}-FIRMADA.pdf`;
  const outputPath = path.join(directory, signedName);

  await fs.writeFile(outputPath, buffer);

  const relativePath = path.join("assignments", "signed", signedName);

  await prisma.assignment.update({
    where: {
      id: assignmentId,
    },
    data: {
      signedPdfPath: relativePath,
    },
  });
}
