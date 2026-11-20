import { test } from "node:test";
import assert from "node:assert/strict";
import { buildNotification } from "../src/lib/notify";

const event = { id: "ev1", title: "Club de lectura", startsAt: new Date("2026-12-01T22:00:00Z"), comuna: "Providencia" };
const to = { id: "u1", email: "a@b.cl", name: "Ana Pérez", locale: "es", emailNotifications: true };

test("notification emails are localized and link to the right page", () => {
  const es = buildNotification("accepted", to, event);
  assert.match(es.subject, /Estás dentro de «Club de lectura»/);
  assert.match(es.text, /Hola Ana,/);
  assert.match(es.text, /\/events\/ev1/);
  assert.match(es.text, /Providencia/);
  const en = buildNotification("feedback", { ...to, locale: "en" }, event);
  assert.match(en.subject, /How was/);
  assert.match(en.text, /\/events\/ev1\/feedback/);
});

test("names in notifications are escaped in HTML", () => {
  const n = buildNotification("joined", to, { ...event, title: "<script>x</script>" }, { who: "Bob" });
  assert.equal(n.html.includes("<script>"), false);
});
