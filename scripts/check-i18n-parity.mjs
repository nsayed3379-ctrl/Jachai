// Asserts the en/bn dictionaries in src/lib/i18n.ts cover the same keys, so a
// key added for one language is never silently missing for the other. The one
// expected asymmetry: a pluralized key's ".one" variant (English only — see
// translateCount() in lib/i18n.ts, Bangla has no one/other split for
// cardinals) doesn't need a bn counterpart as long as ".other" exists on both.
import { dictionary } from "../src/lib/i18n.ts";

const enKeys = new Set(Object.keys(dictionary.en));
const bnKeys = new Set(Object.keys(dictionary.bn));

function isExpectedOneOnlyKey(key, otherSet) {
  return key.endsWith(".one") && otherSet.has(key.replace(/\.one$/, ".other"));
}

const missingInBn = [...enKeys].filter((k) => !bnKeys.has(k) && !isExpectedOneOnlyKey(k, bnKeys));
const missingInEn = [...bnKeys].filter((k) => !enKeys.has(k) && !isExpectedOneOnlyKey(k, enKeys));

if (missingInBn.length === 0 && missingInEn.length === 0) {
  console.log(`i18n parity OK — ${enKeys.size} en keys, ${bnKeys.size} bn keys.`);
  process.exit(0);
}

if (missingInBn.length > 0) {
  console.error(`Missing in bn (${missingInBn.length}):`);
  for (const k of missingInBn) console.error(`  ${k}`);
}
if (missingInEn.length > 0) {
  console.error(`Missing in en (${missingInEn.length}):`);
  for (const k of missingInEn) console.error(`  ${k}`);
}
process.exit(1);
