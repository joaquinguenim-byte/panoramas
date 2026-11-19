import { test } from "node:test";
import assert from "node:assert/strict";
import { isValidRut, formatRut, ageOn, normalizeId } from "../src/lib/verification";
import { checkContent } from "../src/lib/moderation";
import { chileLocalToDate } from "../src/lib/time";

test("RUT check digit", () => {
  assert.equal(isValidRut("12.345.678-5"), true);
  assert.equal(isValidRut("12345678-9"), false);
  assert.equal(isValidRut("7.654.321-6"), true);
  assert.equal(isValidRut("20.123.456-K".replace("K", "k")), isValidRut("20.123.456-K"));
  assert.equal(formatRut("123456785"), "12.345.678-5");
  assert.equal(normalizeId("rut", "foo"), null);
});

test("age", () => {
  assert.equal(ageOn(new Date("2008-11-20"), new Date("2026-11-19")), 17);
  assert.equal(ageOn(new Date("2008-11-19"), new Date("2026-11-19")), 18);
});

test("content rules", () => {
  assert.equal(checkContent("Club de lectura en Plaza de Armas").ok, true);
  assert.equal(checkContent("Trekking y picnic", "excitante citación").ok, true);
  assert.deepEqual(checkContent("Speed dating en Providencia"), { ok: false, rule: "dating" });
  assert.deepEqual(checkContent("Fiesta +18"), { ok: false, rule: "adult" });
  assert.deepEqual(checkContent("Vamos al rodeo"), { ok: false, rule: "animals" });
});

test("Chile local time", () => {
  // November: Chile is UTC-3 (summer time)
  assert.equal(chileLocalToDate("2026-11-25T19:00")!.toISOString(), "2026-11-25T22:00:00.000Z");
  // July: UTC-4
  assert.equal(chileLocalToDate("2026-07-10T08:00")!.toISOString(), "2026-07-10T12:00:00.000Z");
});
