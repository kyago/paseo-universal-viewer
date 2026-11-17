import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import ts from "typescript";

const nodeRequire = createRequire(import.meta.url);

// Runs a plugin source file with the host modules replaced; the apps are the only place it runs for real.
function load(file, stubs) {
  const js = ts.transpileModule(readFileSync(new URL(file, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", js)((name) => stubs[name] ?? nodeRequire(name), module, module.exports);
  return module.exports;
}

function loadPlugin(os, read = () => ({ status: "loading" })) {
  const reactNative = { Platform: { OS: os }, Text: "Text", TextInput: "TextInput", View: "View" };
  const json = load("../client/json.ts", {});
  const panels = load("../client/panels.tsx", {
    "./json": json,
    "react-native": reactNative,
    "@getpaseo/plugin/client": { useFileText: read, useFileUrl: read },
    "@getpaseo/plugin/client/ui": { Loading: "Loading", DocumentFrame: "DocumentFrame" },
  });
  const entry = load("../index.client.tsx", { "react-native": reactNative, "./client/panels": panels });
  const registered = [];
  entry.default({ addFilePanel: (contribution) => (registered.push(contribution), () => {}) });
  return { registered, byId: Object.fromEntries(registered.map((panel) => [panel.id, panel])) };
}

// The components hold no React state, so calling them yields what a renderer would mount.
function render(element) {
  while (typeof element.type === "function") element = element.type(element.props);
  return element;
}

const theme = { colors: { foreground: "#fff", foregroundMuted: "#888", statusDanger: "#f00", accent: "#00f", statusSuccess: "#0f0", statusWarning: "#ff0" } };

test("every device gets the PDF panel; only iOS gets text selection and Office previews", () => {
  for (const os of ["web", "android", "macos"]) {
    const { registered, byId } = loadPlugin(os);
    assert.deepEqual(registered.map((panel) => panel.id), ["document"], os);
    assert.deepEqual(byId.document.files.extensions, ["pdf"], os);
  }
  const { registered, byId } = loadPlugin("ios");
  assert.deepEqual(registered.map((panel) => panel.id).sort(), ["document", "text"]);
  assert.deepEqual(byId.document.files.extensions, ["pdf", "docx", "xlsx", "pptx"]);
});

test("the text panel covers md, sql and extensionless files, and leaves html to Paseo", () => {
  const { files } = loadPlugin("ios").byId.text;
  for (const extension of ["md", "sql", "txt", "json", "ts", "py", "env"]) assert.ok(files.extensions.includes(extension), extension);
  for (const filename of ["README", "LICENSE", "Dockerfile", "Makefile"]) assert.ok(files.filenames.includes(filename), filename);
  for (const extension of ["html", "htm", "pdf", "docx"]) assert.ok(!files.extensions.includes(extension), extension);
});

test("every selector passes Paseo's rules and no file is claimed twice", () => {
  const { registered } = loadPlugin("ios");
  const claimed = registered.flatMap((panel) => [...panel.files.extensions, ...(panel.files.filenames ?? [])]);
  assert.equal(new Set(claimed).size, claimed.length, "claimed twice");
  for (const { id, title, files } of registered) {
    assert.match(id, /^[a-z][a-z0-9-]*$/);
    assert.ok(title);
    // Paseo throws on registration for any of these, and only the app would show that error.
    for (const entry of [...files.extensions, ...(files.filenames ?? [])]) {
      assert.ok(entry.length > 0 && entry.trim() === entry && !/[\\/*?]/.test(entry), entry);
    }
    for (const extension of files.extensions) {
      assert.ok(!extension.includes(".") && extension === extension.toLowerCase(), extension);
    }
  }
});

test("a read file is shown in a read-only multiline text input, the view iOS can select by range", () => {
  const { Component } = loadPlugin("ios", () => ({ status: "ready", text: "select *\nfrom t;" })).byId.text;
  const view = render(Component({ file: { size: 16, extension: "sql" }, theme }));
  assert.equal(view.type, "TextInput");
  assert.equal(view.props.multiline, true);
  assert.equal(view.props.editable, false);
  assert.equal(view.props.value, "select *\nfrom t;");
});

test("loading and read errors are shown instead of an empty text view", () => {
  const loading = loadPlugin("ios").byId.text.Component;
  assert.equal(render(loading({ file: { size: 1, extension: "md" }, theme })).type, "Loading");
  const failed = loadPlugin("ios", () => ({ status: "error", error: new Error("The file was deleted.") })).byId.text.Component;
  const notice = render(failed({ file: { size: 1, extension: "md" }, theme }));
  assert.equal(notice.type, "View");
  assert.equal(notice.props.children.props.children, "The file was deleted.");
});

test("a text file over 1 MiB is refused without being read", () => {
  let reads = 0;
  const { Component } = loadPlugin("ios", () => (reads++, { status: "ready", text: "" })).byId.text;
  const notice = render(Component({ file: { size: 1024 * 1024 + 1 }, theme }));
  assert.equal(notice.type, "View");
  assert.equal(reads, 0);
  assert.equal(render(Component({ file: { size: 1024 * 1024, extension: "json" }, theme })).type, "TextInput");
});

test("a document is handed to Paseo's document frame by its local URL", () => {
  const ready = loadPlugin("web", () => ({ status: "ready", url: "blob:report" })).byId.document.Component;
  const frame = render(ready({ file: {}, theme }));
  assert.equal(frame.type, "DocumentFrame");
  assert.equal(frame.props.url, "blob:report");
  assert.equal(render(loadPlugin("web").byId.document.Component({ file: {}, theme })).type, "Loading");
  const failed = loadPlugin("web", () => ({ status: "error", error: new Error("The file was deleted.") })).byId.document.Component;
  assert.equal(render(failed({ file: {}, theme })).props.children.props.children, "The file was deleted.");
});

test("json is split into coloured runs that join back to the file, and big files stay plain", () => {
  const source = '{\n  "name": "a\\"b: 1",\n  "n": -1.5e3, "ok": true, "x": null, "list": [1, "two"]\n} trailing';
  const { jsonSegments } = load("../client/json.ts", {});
  const segments = jsonSegments(source);
  assert.equal(segments.map((segment) => segment.text).join(""), source);
  const kindOf = (text) => segments.find((segment) => segment.text === text)?.kind;
  assert.equal(kindOf('"name"'), "key");
  assert.equal(kindOf('"a\\"b: 1"'), "string");
  assert.equal(kindOf("-1.5e3"), "number");
  assert.equal(kindOf("true"), "literal");
  assert.equal(kindOf('"two"'), "string");
  assert.equal(jsonSegments("not json {").map((segment) => segment.text).join(""), "not json {");

  const { Component } = loadPlugin("ios", () => ({ status: "ready", text: '{"a": 1}' })).byId.text;
  const view = render(Component({ file: { size: 8, extension: "json" }, theme }));
  assert.equal(view.props.children.map((child) => child.props.children).join(""), '{"a": 1}');
  assert.equal(view.props.children[1].props.style.color, theme.colors.foreground);
  const big = render(Component({ file: { size: 200 * 1024 + 1, extension: "json" }, theme }));
  assert.equal(big.props.value, '{"a": 1}');
});
