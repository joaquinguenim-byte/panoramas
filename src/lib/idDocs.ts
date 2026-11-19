/**
 * Private storage for ID document photos.
 *
 * PILOT: files are written to ./storage/id-docs on the server, outside /public,
 * so they are never served. Before launch, move this to a private, encrypted
 * bucket (e.g. Supabase Storage / S3 with server-side encryption), restrict
 * access to the review/KYC process, and delete documents once verified
 * (Ley 19.628 / 21.719 on personal data).
 */
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

export const MAX_ID_DOC_BYTES = 6 * 1024 * 1024;
const DIR = path.join(process.cwd(), "storage", "id-docs");

/** Detect type from the file's first bytes, not from its name. */
export function sniffType(buf: Buffer): "jpg" | "png" | "webp" | "pdf" | "heic" | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  if (buf.toString("ascii", 0, 5) === "%PDF-") return "pdf";
  if (buf.toString("ascii", 4, 8) === "ftyp" && /^(heic|heix|mif1|msf1|hevc)$/.test(buf.toString("ascii", 8, 12))) return "heic";
  return null;
}

export type SaveResult = { ok: true; relPath: string } | { ok: false; error: "idDocMissing" | "idDocTooBig" | "idDocType" };

export async function saveIdDoc(userId: string, file: File | null): Promise<SaveResult> {
  if (!file || file.size === 0) return { ok: false, error: "idDocMissing" };
  if (file.size > MAX_ID_DOC_BYTES) return { ok: false, error: "idDocTooBig" };
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = sniffType(buf);
  if (!ext) return { ok: false, error: "idDocType" };
  await mkdir(DIR, { recursive: true });
  const name = `${userId}-${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;
  await writeFile(path.join(DIR, name), buf, { mode: 0o600 });
  return { ok: true, relPath: `storage/id-docs/${name}` };
}
