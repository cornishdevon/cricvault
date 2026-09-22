const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");

const source = fs.readFileSync(path.join(__dirname, "../utils/appleSignIn.ts"), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const helpers = {};
vm.runInNewContext(compiled, { exports: helpers });
const { signInWithAppleFallback, isAuthCancelled, authErrorMessage } = helpers;
const rejected = { status: 403, errors: [{ code: "authorization_invalid" }] };

test("successful native login is returned without browser or notice", async () => {
  const session = { createdSessionId: "native-session" };
  assert.equal(await signInWithAppleFallback(
    async () => session,
    () => assert.fail("unexpected browser"),
    () => assert.fail("unexpected notice"),
  ), session);
});

test("native authorization rejection opens Apple OAuth exactly once and announces it", async () => {
  const calls = [];
  const session = { createdSessionId: "browser-session" };
  assert.equal(await signInWithAppleFallback(
    async () => { calls.push("native"); throw rejected; },
    async () => { calls.push("browser"); return session; },
    () => calls.push("notice"),
  ), session);
  assert.deepEqual(calls, ["native", "notice", "browser"]);
});

for (const [name, error] of [
  ["user cancellation", { code: "ERR_REQUEST_CANCELED" }],
  ["network failure", new Error("Network request failed")],
  ["other authorization failure", { status: 403, errors: [{ code: "user_locked" }] }],
  ["malformed error", null],
]) {
  test(`${name} never launches another sign-in`, async () => {
    await assert.rejects(
      signInWithAppleFallback(
        async () => { throw error; },
        () => assert.fail("unexpected browser"),
        () => assert.fail("unexpected notice"),
      ),
      (caught) => caught === error,
    );
  });
}

test("browser rejection propagates without retry loops", async () => {
  const browserError = new Error("Apple OAuth unavailable");
  let attempts = 0;
  await assert.rejects(signInWithAppleFallback(
    async () => { throw rejected; },
    async () => { attempts++; throw browserError; },
    () => {},
  ), (e) => e === browserError);
  assert.equal(attempts, 1);
});

test("browser cancellation is preserved for the UI to dismiss quietly", async () => {
  const result = { createdSessionId: null, authSessionResult: { type: "cancel" } };
  assert.equal(await signInWithAppleFallback(
    async () => { throw rejected; }, async () => result, () => {},
  ), result);
});

test("error messages expose actionable details without serializing tokens", () => {
  assert.equal(authErrorMessage({ errors: [{ longMessage: "Not authorized" }], token: "never show" }, "Fallback"), "Not authorized");
  assert.equal(authErrorMessage(new Error("Session activation failed"), "Fallback"), "Session activation failed");
  assert.equal(authErrorMessage(null, "Fallback"), "Fallback");
  assert.equal(isAuthCancelled({ code: "ERR_REQUEST_CANCELED" }), true);
  assert.equal(isAuthCancelled(rejected), false);
});

// Exercise the real component handlers with only the OS/Clerk bridges replaced.
const componentSource = fs.readFileSync(path.join(__dirname, "../components/SocialAuthButtons.tsx"), "utf8");
const componentJs = ts.transpileModule(componentSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

function mount({ native, browser, activeError, sessionTask } = {}) {
  const events = [];
  const jsx = (type, props) => ({ type, props });
  const setActive = async ({ session, navigate }) => {
    events.push(["activate", session]);
    if (activeError) throw activeError;
    await navigate({
      session: { currentTask: sessionTask },
      decorateUrl: () => { throw new Error("native navigation must not use browser URLs"); },
    });
  };
  const session = { createdSessionId: "session-test", setActive };
  const exports = {};
  vm.runInNewContext(componentJs, {
    exports,
    require(name) {
      if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
      if (name === "react") return {
        useCallback: (fn) => fn,
        useRef: (value) => ({ current: value }),
        useState: (value) => [value, (next) => events.push(["state", next])],
      };
      if (name === "@clerk/expo") return { useSSO: () => ({
        startSSOFlow: async (options) => {
          events.push(["browser", options.strategy, options.redirectUrl]);
          return browser ? browser(session) : session;
        },
      }) };
      if (name === "@clerk/expo/apple") return { useSignInWithApple: () => ({
        startAppleAuthenticationFlow: async () => {
          events.push(["native"]);
          return native ? native(session) : session;
        },
      }) };
      if (name === "expo-apple-authentication") return {
        AppleAuthenticationButton: "AppleButton",
        AppleAuthenticationButtonType: { CONTINUE: 0 },
        AppleAuthenticationButtonStyle: { BLACK: 0, WHITE: 1 },
      };
      if (name === "expo-auth-session") return { makeRedirectUri: () => "cricvault://" };
      if (name === "expo-router") return { useRouter: () => ({ replace: (url) => events.push(["navigate", url]) }) };
      if (name === "react-native") return {
        Platform: { OS: "ios" }, Pressable: "Pressable", Text: "Text", View: "View",
        useColorScheme: () => "light", StyleSheet: { create: (s) => s },
      };
      if (name === "@/hooks/useColors") return { useColors: () => ({}) };
      if (name === "@/utils/appleSignIn") return helpers;
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  const root = exports.SocialAuthButtons();
  const apple = root.props.children.find((child) => child?.type === "AppleButton");
  return { press: apple.props.onPress, events };
}

test("component activates native session then navigates to tabs", async () => {
  const app = mount();
  await app.press();
  assert.deepEqual(app.events.filter(([event]) => ["native", "activate", "navigate"].includes(event)),
    [["native"], ["activate", "session-test"], ["navigate", "/(tabs)"]]);
});

test("component recovers authorization_invalid using Apple OAuth and same app callback", async () => {
  const app = mount({ native: async () => { throw rejected; } });
  await app.press();
  assert.ok(app.events.some((e) => e[0] === "browser" && e[1] === "oauth_apple" && e[2] === "cricvault://"));
  assert.ok(app.events.some((e) => e[0] === "navigate" && e[1] === "/(tabs)"));
});

test("component does not navigate or launch browser when session activation fails", async () => {
  const app = mount({ activeError: new Error("Session activation failed") });
  await app.press();
  assert.ok(app.events.some((e) => e[0] === "state" && e[1] === "Session activation failed"));
  assert.equal(app.events.some((e) => ["navigate", "browser"].includes(e[0])), false);
});

test("component never activates a cancelled browser flow", async () => {
  const app = mount({
    native: async () => { throw rejected; },
    browser: async () => ({ createdSessionId: null, authSessionResult: { type: "cancel" } }),
  });
  await app.press();
  assert.equal(app.events.some((e) => ["activate", "navigate"].includes(e[0])), false);
});

test("duplicate taps launch only one Apple prompt", async () => {
  const app = mount();
  await Promise.all([app.press(), app.press()]);
  assert.equal(app.events.filter((e) => e[0] === "native").length, 1);
});

test("required session tasks show instructions rather than silently returning", async () => {
  const app = mount({ sessionTask: { key: "reset-password" } });
  await app.press();
  assert.equal(app.events.some((e) => e[0] === "navigate"), false);
  assert.ok(app.events.some((e) => e[0] === "state" && typeof e[1] === "string" && e[1].includes("additional verification")));
});