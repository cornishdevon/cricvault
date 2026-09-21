const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");

// Exercise the real utility while replacing only the device-only native bridge.
const source = fs.readFileSync(path.join(__dirname, "../utils/exportCsv.ts"), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;

function setup({ directory = "file:///documents/", available = true, writeError, shareError } = {}) {
  const writes = [];
  const shares = [];
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      if (name === "expo-file-system/legacy") return {
        documentDirectory: directory,
        EncodingType: { UTF8: "utf8" },
        async writeAsStringAsync(...args) {
          if (writeError) throw writeError;
          writes.push(args);
        },
      };
      if (name === "expo-sharing") return {
        async isAvailableAsync() { return available; },
        async shareAsync(...args) {
          if (shareError) throw shareError;
          shares.push(args);
        },
      };
      throw new Error(`Unexpected native import: ${name}`);
    },
  });
  return { exportStatsCsv: exports.exportStatsCsv, writes, shares };
}

test("writes UTF-8 CSV and opens the native CSV share sheet", async () => {
  const app = setup();
  await app.exportStatsCsv([{
    matchId: 1, date: "2026-09-21", opponent: 'Équipe, "A"\r\nB',
    matchType: "League", playingFor: null, isPractice: false,
    runs: 0, wickets: 3, runOuts: 1,
  }]);
  assert.equal(app.writes.length, 1);
  const [uri, csv, options] = app.writes[0];
  assert.match(uri, /^file:\/\/\/documents\/cricvault_stats_\d{4}-\d{2}-\d{2}\.csv$/);
  assert.equal(options.encoding, "utf8");
  assert.match(csv, /"Équipe, ""A""\r\nB"/);
  assert.match(csv, /League,,,false/);
  assert.equal(csv.split("\n")[0].split(",").length, 26);
  assert.equal(app.shares[0][0], uri);
  assert.equal(app.shares[0][1].mimeType, "text/csv");
  assert.equal(app.shares[0][1].UTI, "public.comma-separated-values-text");
});

test("empty export retains column headers", async () => {
  const app = setup();
  await app.exportStatsCsv([]);
  assert.match(app.writes[0][1], /^date,opponent,.*runOuts\n$/);
});

test("carriage returns alone are quoted", async () => {
  const app = setup();
  await app.exportStatsCsv([{ opponent: "A\rB" }]);
  assert.ok(app.writes[0][1].includes('"A\rB"'));
});

test("missing device storage fails before writing or sharing", async () => {
  const app = setup({ directory: null });
  await assert.rejects(app.exportStatsCsv([]), /File storage is not available/);
  assert.equal(app.writes.length, 0);
  assert.equal(app.shares.length, 0);
});

test("unavailable sharing reports an explicit error", async () => {
  const app = setup({ available: false });
  await assert.rejects(app.exportStatsCsv([]), /Sharing is not available/);
  assert.equal(app.shares.length, 0);
});

test("write and share failures propagate to the caller's error UI", async () => {
  const writeError = new Error("Storage full");
  const app = setup({ writeError });
  await assert.rejects(app.exportStatsCsv([]), (error) => error === writeError);
  assert.equal(app.shares.length, 0);
  const shareError = new Error("Native share failed");
  await assert.rejects(setup({ shareError }).exportStatsCsv([]), (error) => error === shareError);
});