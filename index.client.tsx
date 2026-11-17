import type { PluginClientContext } from "@getpaseo/plugin/client";
import { Platform } from "react-native";
import { DocumentPanel, SelectableTextPanel } from "./client/panels";
import { text } from "./client/text";

const ios = Platform.OS === "ios";

// File panel selectors have no wildcard, so text files are listed by extension. A dotfile's
// extension is its whole name (.env is "env"). html is left out: its preview is a web view,
// which already selects by range.
const TEXT_EXTENSIONS = [
  "md", "markdown", "mdx", "txt", "log", "rst", "typ", "tex",
  "sql", "csv", "tsv", "json", "jsonl", "yaml", "yml", "toml", "xml",
  "ini", "conf", "cfg", "properties", "diff", "patch",
  "js", "jsx", "mjs", "cjs", "ts", "tsx", "css", "scss", "vue", "svelte",
  "py", "sh", "bash", "zsh", "rb", "go", "rs", "java", "kt", "kts", "swift",
  "c", "h", "cpp", "hpp", "cs", "php", "dart", "lua", "r", "gradle", "tf", "proto", "graphql",
  "env", "local", "example", "gitignore", "gitattributes", "dockerignore", "editorconfig", "npmrc", "zshrc", "bashrc",
];

// Files with no extension can only be claimed by exact name.
const TEXT_FILENAMES = [
  "README", "LICENSE", "CHANGELOG", "NOTICE", "AUTHORS", "CONTRIBUTING", "COPYING", "TODO", "VERSION", "CODEOWNERS",
  "Dockerfile", "Makefile", "Procfile", "Gemfile", "Rakefile", "Brewfile", "Justfile", "Vagrantfile", "Caddyfile", "Jenkinsfile",
];

export default function contribute(client: PluginClientContext) {
  // Paseo has no PDF panel anywhere. Only the iOS web view also previews Office files.
  client.addFilePanel({
    id: "document",
    title: text.message("documentPanel"),
    icon: "FileText",
    files: { extensions: ios ? ["pdf", "docx", "xlsx", "pptx"] : ["pdf"] },
    Component: DocumentPanel,
  });
  // Only iOS lacks range selection in text files. Registering this elsewhere would take over
  // from the desktop editor.
  if (ios) {
    client.addFilePanel({
      id: "text",
      title: text.message("textPanel"),
      icon: "TextSelect",
      files: { extensions: TEXT_EXTENSIONS, filenames: TEXT_FILENAMES },
      Component: SelectableTextPanel,
    });
  }
  // Paseo removes the registrations when the entry unloads.
  return () => {};
}
