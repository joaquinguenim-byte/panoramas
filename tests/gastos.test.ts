import { test } from "node:test";
import assert from "node:assert/strict";
import { gastosUrl } from "../src/lib/gastos";

test("Gastos.lat handoff link carries the plan", () => {
  const u = new URL(
    gastosUrl(
      { id: "ev1", title: "Asado, en Ñuñoa", startsAt: new Date("2026-12-06T02:00:00Z"), people: ["Ana", "Beto", "Ana", " ", "Ca,mi"] },
      "https://www.gastos.lat/new",
    ),
  );
  assert.equal(u.origin + u.pathname, "https://www.gastos.lat/new");
  assert.equal(u.searchParams.get("name"), "Asado, en Ñuñoa");
  assert.equal(u.searchParams.get("people"), "Ana,Beto,Ca mi");
  assert.equal(u.searchParams.get("date"), "2026-12-05"); // Chile time, not UTC
  assert.equal(u.searchParams.get("ref"), "panoramas");
  assert.equal(u.searchParams.get("ext_id"), "ev1");
});
