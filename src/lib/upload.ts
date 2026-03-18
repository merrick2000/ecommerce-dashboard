import { writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import crypto from "crypto";

export async function uploadFileLocally(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Generate a unique filename to prevent overwrites
  const ext = file.name.split('.').pop();
  const uniqueName = `${crypto.randomBytes(16).toString('hex')}.${ext}`;

  // In Next.js, 'public/uploads' is served statically from '/uploads'
  const path = join(process.cwd(), 'public/uploads', uniqueName);

  // Ensure the directory exists before writing to prevent ENOENT errors
  await mkdir(dirname(path), { recursive: true });

  await writeFile(path, buffer);

  return `/uploads/${uniqueName}`;
}
