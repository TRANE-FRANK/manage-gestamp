import fs from "fs/promises";
import path from "path";

export async function ensureDirectory(relativeDirectory: string) {
  const fullPath = path.join(process.cwd(), "storage", relativeDirectory);

  await fs.mkdir(fullPath, {
    recursive: true,
  });

  return fullPath;
}

export function getStoragePath(relativePath: string) {
  return path.join(process.cwd(), "storage", relativePath);
}

export async function deleteFile(filePath: string) {
  try {
    await fs.unlink(filePath);
  } catch {}
}
