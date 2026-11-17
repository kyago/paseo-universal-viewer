Opens files that Paseo's own viewer handles poorly or not at all.

PDFs open inside the file tab on desktop, web, iPhone and iPad. Paseo has no PDF viewer of its own. Android cannot show a PDF inline and names the file type instead.

On iPhone and iPad, text files open as plain text you can select by range. Long-press a word, drag the handles across as many lines as you need, then copy. Paseo's own source view on iOS only copies the whole line you pressed. This covers Markdown, SQL, JSON, YAML, logs, common source code extensions, dotfiles such as `.env`, and files with no extension such as `README`, `LICENSE`, `Dockerfile` and `Makefile`. The text is shown raw in a monospaced font, with no syntax colours and no rendered Markdown, and it is read-only. Text files over 1 MB are not opened.

Also on iPhone and iPad, Word, Excel and PowerPoint files (`docx`, `xlsx`, `pptx`) open in the iOS web view's built-in preview. How well a file renders is up to iOS.

For text files Paseo asks which panel to use the first time you open one, because its own viewer can open them too. "다시 묻지 않기" remembers the answer for that extension or file name on that device. "다음으로 열기…" in the tab menu switches a tab between "텍스트 선택" and Paseo's own panel at any time. A link that targets a line always opens in Paseo's own viewer.

Text selection and Office previews are registered on iOS only, so text files on desktop, web and Android behave as before. Requires Paseo 0.15 or later on the app and the daemon.
