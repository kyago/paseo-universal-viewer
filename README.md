# paseo-universal-viewer

A Paseo plugin that opens files Paseo's own viewer handles poorly or not at all.

- **PDF, every device:** PDFs open inside the file tab on desktop, web, iPhone and iPad. Android cannot show a PDF inline and names the file type instead.
- **Selectable text, iPhone and iPad:** text files open as plain text you can select by range. Long-press, drag the handles across lines, copy. Paseo's own source view on iOS only copies the whole line you pressed.
- **JSON colours, iPhone and iPad:** `.json` and `.jsonl` files up to 200 KB get syntax colours, with no extra dependency.
- **Office previews, iPhone and iPad:** `docx`, `xlsx` and `pptx` open in the iOS web view's built-in preview.
- **Languages:** English and Korean, following the app language.

## Using it

For text files Paseo asks which panel to use the first time you open one. Pick **Selectable text** and tick **Don't ask me again** to remember it for that extension on that device. **Settings → Files** sets every extension in one place, and **Open with…** in the tab menu switches a single tab.

Text files covered: Markdown, SQL, JSON, YAML, TOML, CSV, logs, common source code extensions, dotfiles such as `.env` and `.gitignore`, and extensionless files such as `README`, `LICENSE`, `Dockerfile` and `Makefile`. The list is in `index.client.tsx`; file panel selectors have no wildcard.

## Limits

- Text is shown raw, monospaced and read-only. Only JSON is coloured, and Markdown is not rendered.
- Text files over 1 MB are not opened here.
- A link that targets a line (`file.md:42`) always opens in Paseo's own viewer.
- Text selection and Office previews are registered on iOS only. On desktop, web and Android, text files behave as before.
- Office rendering is up to iOS. Spreadsheets with several sheets may not show.
- HTML is left to Paseo: its preview is a web view, which already selects by range.

## Development

```sh
npm install
npm run typecheck
npm test
paseo plugin install /path/to/paseo-universal-viewer
```

Requires Paseo 0.15 or later on the app and the daemon. Text selection and JSON colours were checked on an iPhone running Paseo 0.15.4.
