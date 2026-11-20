import { test } from "node:test";
import assert from "node:assert/strict";
import { hashToken } from "../src/lib/tokens";
import { nextVerifyStep } from "../src/lib/verification";

test("tokens are stored hashed", () => {
  const h = hashToken("abc");
  assert.equal(h.length, 64);
  assert.notEqual(h, "abc");
  assert.equal(hashToken("abc"), h);
});

test("verification order: email, then ID", () => {
  const d = new Date();
  assert.equal(nextVerifyStep({ emailVerifiedAt: null, verifiedAt: null }), "/verify-email");
  assert.equal(nextVerifyStep({ emailVerifiedAt: null, verifiedAt: d }), "/verify-email");
  assert.equal(nextVerifyStep({ emailVerifiedAt: d, verifiedAt: null }), "/verify");
  assert.equal(nextVerifyStep({ emailVerifiedAt: d, verifiedAt: d }), null);
});
