import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";

const execFileAsync = promisify(execFile);

export async function convertExcelToPdf(excelPath: string) {
  const outputDirectory = path.dirname(excelPath);

  await execFileAsync("libreoffice", [
    "--headless",
    "--convert-to",
    "pdf",
    excelPath,
    "--outdir",
    outputDirectory,
  ]);

  const pdfPath = excelPath.replace(/\.xlsx$/i, ".pdf");

  try {
    await fs.access(pdfPath);
  } catch {
    throw new Error("LibreOffice no generó el PDF.");
  }

  await fs.unlink(excelPath);
  return pdfPath;
}
