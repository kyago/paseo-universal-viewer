export type JsonKind = "key" | "string" | "number" | "literal" | "punct" | "plain";
export interface JsonSegment {
  text: string;
  kind: JsonKind;
}

const TOKEN = /("(?:\\.|[^"\\\n])*")(\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[{}[\],:]/g;

/** Splits JSON text into coloured runs. The runs always join back to the input, valid JSON or not. */
export function jsonSegments(text: string): JsonSegment[] {
  const segments: JsonSegment[] = [];
  const push = (value: string, kind: JsonKind) => {
    if (!value) return;
    const last = segments[segments.length - 1];
    if (last?.kind === kind) last.text += value;
    else segments.push({ text: value, kind });
  };
  let end = 0;
  for (const match of text.matchAll(TOKEN)) {
    push(text.slice(end, match.index), "plain");
    const [token, quoted, colon] = match;
    if (quoted) {
      push(quoted, colon ? "key" : "string");
      if (colon) push(colon, "punct");
    } else if (/^[{}[\],:]$/.test(token)) push(token, "punct");
    else push(token, /^[tfn]/.test(token) ? "literal" : "number");
    end = match.index + token.length;
  }
  push(text.slice(end), "plain");
  return segments;
}
