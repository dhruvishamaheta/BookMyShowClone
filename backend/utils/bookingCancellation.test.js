import test from "node:test";
import assert from "node:assert/strict";
import { calculateCancellationAmounts, parseShowStartAt } from "./bookingCancellation.js";

test("parses ISO dates and 12-hour showtimes with venue text", () => {
  const showStartAt = parseShowStartAt("2026-12-30", "06:30 PM | Main Auditorium");

  assert.ok(showStartAt instanceof Date);
  assert.equal(showStartAt.toISOString(), "2026-12-30T13:00:00.000Z");
});

test("parses day-first dates and 24-hour showtimes", () => {
  const showStartAt = parseShowStartAt("30/12/2026", "18:30");

  assert.ok(showStartAt instanceof Date);
  assert.equal(showStartAt.toISOString(), "2026-12-30T13:00:00.000Z");
});

test("rejects dates or showtimes that cannot be validated", () => {
  assert.equal(parseShowStartAt("not a date", "6:30 PM"), null);
  assert.equal(parseShowStartAt("2026-12-30", "Regular"), null);
});

test("calculates an 80 percent refund after the 20 percent fee", () => {
  assert.deepEqual(calculateCancellationAmounts(1000), {
    paidAmount: 1000,
    cancellationFee: 200,
    refundAmount: 800,
  });
});
