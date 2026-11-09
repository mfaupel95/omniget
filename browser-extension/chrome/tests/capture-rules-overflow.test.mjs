import test from "node:test";
import assert from "node:assert/strict";
import { parseSizeRule, evaluateCapture } from "../src/capture-rules.js";

const overflowingDecimal = "9".repeat(309);
// This operand is finite before converting GB to bytes.
const overflowingGigabytes = "9".repeat(300);

test("parseSizeRule rejects overflow in comparisons and either range bound", () => {
  for (const value of [overflowingDecimal, `${overflowingGigabytes} GB`]) {
    for (const input of [value, `>=${value}`, `1-${value}`, `${value.replace(/ GB$/, "")}-1${value.endsWith(" GB") ? " GB" : ""}`]) {
      assert.equal(parseSizeRule(input), null, input);
    }
  }
});

test("invalid overflowing ranges do not silently discard captured media", () => {
  const verdict = evaluateCapture({
    url: "https://example.com/video.mp4",
    contentType: "video/mp4",
    contentLength: 1024 * 1024,
    extensions: [{ ext: ".mp4", size: `${overflowingGigabytes}-${overflowingGigabytes} GB` }],
    contentTypes: [],
  });
  assert.equal(verdict.capture, true);
});

test("large finite rules and fractional rounding retain their semantics", () => {
  assert.deepEqual(parseSizeRule("1000000 GB"), { operator: ">=", size: 1073741824000000 });
  assert.deepEqual(parseSizeRule("1.5-2.5 B"), { operator: "~", min: 2, max: 3 });
  assert.deepEqual(parseSizeRule(Number.MAX_VALUE), { operator: ">=", size: Number.MAX_VALUE });
});
