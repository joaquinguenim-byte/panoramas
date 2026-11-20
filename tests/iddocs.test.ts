import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "crypto";
import { decrypt, encrypt, sniffType } from "../src/lib/idDocs";

const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), randomBytes(64)]);

test("ID docs are encrypted and round-trip", () => {
  const k = randomBytes(32);
  const blob = encrypt(png, k);
  assert.equal(sniffType(blob), null, "ciphertext must not look like an image");
  assert.equal(blob.includes(png.subarray(8, 40)), false);
  assert.deepEqual(decrypt(blob, k), png);
});

test("tampered or wrong-key ID docs fail to decrypt", () => {
  const k = randomBytes(32);
  const blob = encrypt(png, k);
  assert.throws(() => decrypt(blob, randomBytes(32)));
  blob[blob.length - 1] ^= 1;
  assert.throws(() => decrypt(blob, k));
});
