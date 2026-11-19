/**
 * Identity verification.
 *
 * MVP STUB: we validate the Chilean RUT check digit (módulo 11) and require a
 * birth date that makes the person 18+. We do NOT yet confirm that the RUT/ID
 * belongs to the person. Before public launch, plug in a real KYC provider
 * (document photo + selfie liveness, e.g. a Chilean-ID-capable vendor) in
 * `verifyIdentity` below and only set `verifiedAt` on a positive result.
 */
import { MIN_AGE } from "./constants";

export function cleanRut(input: string): string {
  return input.replace(/[^0-9kK]/g, "").toUpperCase();
}

export function rutCheckDigit(body: string): string {
  let sum = 0;
  let mul = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body[i]) * mul;
    mul = mul === 7 ? 2 : mul + 1;
  }
  const r = 11 - (sum % 11);
  return r === 11 ? "0" : r === 10 ? "K" : String(r);
}

export function isValidRut(input: string): boolean {
  const c = cleanRut(input);
  if (c.length < 8 || c.length > 9) return false;
  const body = c.slice(0, -1);
  const dv = c.slice(-1);
  if (!/^\d+$/.test(body)) return false;
  return rutCheckDigit(body) === dv;
}

export function formatRut(input: string): string {
  const c = cleanRut(input);
  const body = c.slice(0, -1);
  const dv = c.slice(-1);
  return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}-${dv}`;
}

export function ageOn(birth: Date, on = new Date()): number {
  let age = on.getFullYear() - birth.getFullYear();
  const m = on.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && on.getDate() < birth.getDate())) age--;
  return age;
}

export function isAdult(birth: Date): boolean {
  return ageOn(birth) >= MIN_AGE;
}

export type IdType = "rut" | "passport" | "foreign_id";

export function normalizeId(type: IdType, value: string): string | null {
  if (type === "rut") return isValidRut(value) ? formatRut(value) : null;
  const v = value.trim().toUpperCase().replace(/\s+/g, "");
  return /^[A-Z0-9-]{5,20}$/.test(v) ? v : null;
}

/** Placeholder for the real KYC call. Returns true when the ID is acceptable. */
export async function verifyIdentity(type: IdType, normalized: string): Promise<boolean> {
  return normalized.length > 0 && (type !== "rut" || isValidRut(normalized));
}
