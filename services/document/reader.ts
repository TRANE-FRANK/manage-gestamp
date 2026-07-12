import fs from "fs/promises";
import path from "path";

export async function readDocument(relativePath: string) {
  const absolutePath = path.join(
    process.cwd(),
    "storage",
    relativePath,
  );

  return await fs.readFile(absolutePath);
}