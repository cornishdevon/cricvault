const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");
const { I18n } = require("i18n-js");

const root = path.join(__dirname, "..");
const localeSource = fs.readFileSync(path.join(root, "i18n/index.ts"), "utf8");
const locales = [...localeSource.matchAll(/code: "([^"]+)"/g)].map((match) => match[1]);
const translations = Object.fromEntries(locales.map((locale) => {
  const source = fs.readFileSync(path.join(root, `locales/${locale}.ts`), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, { exports });
  return [locale, exports.default];
}));
const placeholders = (value) => [...value.matchAll(/%\{([^}]+)\}/g)].map((match) => match[1]).sort();
const i18n = new I18n(translations);
i18n.enableFallback = false;

for (const locale of locales) {
  test(`${locale}: combined wheels keys and interpolation are complete without fallback`, () => {
    const reference = translations.en.combinedWheels;
    const strings = translations[locale].combinedWheels;
    assert.deepEqual(Object.keys(strings).sort(), Object.keys(reference).sort());
    i18n.locale = locale;
    for (const [key, value] of Object.entries(strings)) {
      assert.equal(typeof value, "string");
      assert.ok(value.trim(), key);
      assert.deepEqual(placeholders(value), placeholders(reference[key]), key);
      const rendered = i18n.t(`combinedWheels.${key}`, {
        mapped: 2, total: 5, filter: "FILTER", value: "VALUE",
      });
      assert.ok(!rendered.includes("%{") && !rendered.includes("[missing"), key);
      if (key.endsWith("Coverage")) {
        assert.ok(rendered.includes("2") && rendered.includes("5"), key);
      }
      if (key === "filterAccessibility") {
        assert.ok(rendered.includes("FILTER") && rendered.includes("VALUE"));
      }
    }
  });
}

test("all combined wheel UI translation references exist", () => {
  for (const file of ["components/CombinedWheels.tsx", "app/(tabs)/index.tsx"]) {
    const source = fs.readFileSync(path.join(root, file), "utf8");
    for (const [, key] of source.matchAll(/t\("combinedWheels\.([^"]+)"/g)) {
      assert.ok(key in translations.en.combinedWheels, `${file}: ${key}`);
    }
  }
});