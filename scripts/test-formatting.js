import assert from "node:assert/strict";
import {
  formatRegionTitle,
  formatDistrictTitle,
  formatJoinedDate,
  FALLBACK_JOINED_DATE,
} from "../js/utils/formatting.js";

assert.equal(formatRegionTitle("surakarta"), "Solo");
assert.equal(formatRegionTitle(" SOLO RAYA "), "Solo Raya");
assert.equal(formatRegionTitle("karanganYAR"), "Karanganyar");
assert.equal(formatRegionTitle(""), "Solo");
assert.equal(formatRegionTitle(null), "Solo");
assert.equal(formatRegionTitle(null, "Solo Raya"), "Solo Raya");

assert.equal(formatDistrictTitle("Kec. jaten"), "Jaten");
assert.equal(formatDistrictTitle("  MOJOSONGO  "), "Mojosongo");
assert.equal(formatDistrictTitle("kec.  Colomadu"), "Colomadu");
assert.equal(formatDistrictTitle("Baki."), "Baki");
assert.equal(formatDistrictTitle(""), "");
assert.equal(formatDistrictTitle(null), "");

assert.equal(formatJoinedDate("25 Agustus 2026"), "25 Agustus 2026");
assert.equal(formatJoinedDate(" 25 Agustus 2026 "), "25 Agustus 2026");
assert.match(formatJoinedDate("2026-08-25T00:00:00Z"), /25 Agustus 2026/);
assert.equal(formatJoinedDate(null), FALLBACK_JOINED_DATE);
assert.equal(formatJoinedDate("-"), FALLBACK_JOINED_DATE);
assert.equal(formatJoinedDate("null"), FALLBACK_JOINED_DATE);
assert.equal(formatJoinedDate("tanggal tidak valid"), "tanggal tidak valid");

console.log("formatting utility checks passed");
