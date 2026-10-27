import fs from "fs/promises";
import path from "path";
import { requireRole } from "@/lib/auth/authorization";

export async function readDocument(relativePath: string) {
  await requireRole("ADMIN", "IT");

  const absolutePath = path.join(
    process.cwd(),
    "storage",
    relativePath,
  );

  return await fs.readFile(absolutePath);
}
