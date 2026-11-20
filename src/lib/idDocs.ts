/**
 * Private storage for ID document photos.
 *
 * Every file is encrypted in the app with AES-256-GCM (ID_DOC_ENCRYPTION_KEY)
 * before it leaves the server, so a leaked bucket or disk holds only ciphertext.
 *
 * Drivers (ID_DOC_STORAGE):
 *  - "supabase": a PRIVATE Supabase Storage bucket (SUPABASE_URL,
 *    SUPABASE_SERVICE_ROLE_KEY, ID_DOC_BUCKET). Only the server holds the key.
 *  - "local" (default in development): ./storage/id-docs, outside /public.
 *
 * Only staff can read a document (see /admin/verifications), and the file is
 * deleted as soon as it has been reviewed (Ley 19.628 / 21.719: keep personal
 * data only as long as needed).
 */
import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

export const MAX_ID_DOC_BYTES = 6 * 1024 * 1024;
const LOCAL_DIR = path.join(process.cwd(), "storage", "id-docs");

export type DocType = "jpg" | "png" | "webp" | "pdf" | "heic";
export const MIME: Record<DocType, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  pdf: "application/pdf",
  heic: "image/heic",
};

/** Detect type from the file's first bytes, not from its name. */
export function sniffType(buf: Buffer): DocType | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  if (buf.toString("ascii", 0, 5) === "%PDF-") return "pdf";
  if (buf.toString("ascii", 4, 8) === "ftyp" && /^(heic|heix|mif1|msf1|hevc)$/.test(buf.toString("ascii", 8, 12))) return "heic";
  return null;
}

// ---------- encryption ----------

const MAGIC = Buffer.from("PNID1"); // format marker + version

function key(): Buffer {
  const raw = process.env.ID_DOC_ENCRYPTION_KEY;
  if (raw) {
    const k = Buffer.from(raw, "base64");
    if (k.length !== 32) throw new Error("ID_DOC_ENCRYPTION_KEY must be 32 bytes, base64 encoded");
    return k;
  }
  if (process.env.NODE_ENV === "production") throw new Error("ID_DOC_ENCRYPTION_KEY is required in production");
  return createHash("sha256").update("panoramas-dev-only-id-doc-key").digest();
}

export function encrypt(plain: Buffer, k = key()): Buffer {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", k, iv);
  const body = Buffer.concat([c.update(plain), c.final()]);
  return Buffer.concat([MAGIC, iv, c.getAuthTag(), body]);
}

export function decrypt(blob: Buffer, k = key()): Buffer {
  if (!blob.subarray(0, MAGIC.length).equals(MAGIC)) throw new Error("Not an encrypted ID document");
  const iv = blob.subarray(MAGIC.length, MAGIC.length + 12);
  const tag = blob.subarray(MAGIC.length + 12, MAGIC.length + 28);
  const d = createDecipheriv("aes-256-gcm", k, iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(blob.subarray(MAGIC.length + 28)), d.final()]);
}

// ---------- storage drivers ----------

type Driver = {
  put(name: string, data: Buffer): Promise<void>;
  get(name: string): Promise<Buffer>;
  remove(name: string): Promise<void>;
};

const local: Driver = {
  async put(name, data) {
    await mkdir(LOCAL_DIR, { recursive: true });
    await writeFile(path.join(LOCAL_DIR, name), data, { mode: 0o600 });
  },
  get: (name) => readFile(path.join(LOCAL_DIR, name)),
  async remove(name) {
    await unlink(path.join(LOCAL_DIR, name)).catch(() => {});
  },
};

function supabase(): Driver {
  const url = process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.ID_DOC_BUCKET || "id-docs";
  if (!url || !secret) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for ID_DOC_STORAGE=supabase");
  const base = `${url.replace(/\/$/, "")}/storage/v1/object`;
  const auth = { Authorization: `Bearer ${secret}`, apikey: secret };
  const check = async (r: Response, what: string) => {
    if (!r.ok) throw new Error(`Supabase storage ${what} failed: ${r.status} ${await r.text()}`);
    return r;
  };
  return {
    async put(name, data) {
      await check(
        await fetch(`${base}/${bucket}/${name}`, {
          method: "POST",
          headers: { ...auth, "Content-Type": "application/octet-stream", "x-upsert": "false" },
          body: new Uint8Array(data),
        }),
        "upload",
      );
    },
    async get(name) {
      const r = await check(await fetch(`${base}/authenticated/${bucket}/${name}`, { headers: auth, cache: "no-store" }), "download");
      return Buffer.from(await r.arrayBuffer());
    },
    async remove(name) {
      await check(
        await fetch(`${base}/${bucket}`, {
          method: "DELETE",
          headers: { ...auth, "Content-Type": "application/json" },
          body: JSON.stringify({ prefixes: [name] }),
        }),
        "delete",
      );
    },
  };
}

function driver(): Driver {
  return process.env.ID_DOC_STORAGE === "supabase" ? supabase() : local;
}

// Stored path format: "<driver>:<file name>" so old and new files can coexist.
// Legacy MVP rows hold "storage/id-docs/<name>" (unencrypted local file).
function parse(stored: string): { drv: Driver; name: string; legacy: boolean } {
  if (stored.startsWith("supabase:")) return { drv: supabase(), name: stored.slice(9), legacy: false };
  if (stored.startsWith("local:")) return { drv: local, name: stored.slice(6), legacy: false };
  return { drv: local, name: path.basename(stored), legacy: true };
}

// ---------- public API ----------

export type SaveResult = { ok: true; relPath: string } | { ok: false; error: "idDocMissing" | "idDocTooBig" | "idDocType" };

export async function saveIdDoc(userId: string, file: File | null): Promise<SaveResult> {
  if (!file || file.size === 0) return { ok: false, error: "idDocMissing" };
  if (file.size > MAX_ID_DOC_BYTES) return { ok: false, error: "idDocTooBig" };
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = sniffType(buf);
  if (!ext) return { ok: false, error: "idDocType" };
  const name = `${userId}-${Date.now()}-${randomBytes(6).toString("hex")}.${ext}.enc`;
  const drvName = process.env.ID_DOC_STORAGE === "supabase" ? "supabase" : "local";
  await driver().put(name, encrypt(buf));
  return { ok: true, relPath: `${drvName}:${name}` };
}

/** Decrypted document for staff review. */
export async function readIdDoc(stored: string): Promise<{ data: Buffer; type: DocType }> {
  const { drv, name, legacy } = parse(stored);
  const raw = await drv.get(name);
  const data = legacy ? raw : decrypt(raw);
  return { data, type: sniffType(data) ?? "pdf" };
}

export async function deleteIdDoc(stored: string): Promise<void> {
  const { drv, name } = parse(stored);
  await drv.remove(name);
}
