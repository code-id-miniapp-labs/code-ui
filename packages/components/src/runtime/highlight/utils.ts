export interface HighlightChunk {
  text: string;
  match: boolean;
}

export interface HighlightOptions {
  /** Case-insensitive matching. @default true */
  ignoreCase?: boolean | undefined;
  /** Highlight all occurrences rather than only the first match. @default true */
  matchAll?: boolean | undefined;
  /** Match whole words only. @default false */
  exactMatch?: boolean | undefined;
}

const REGEXP_SPECIAL_RE = /[.*+?^${}()|[\]\\]/g;
const WORD_CHAR_RE = /^\w$/;

function escapeRegExp(value: string): string {
  return value.replace(REGEXP_SPECIAL_RE, "\\$&");
}

function buildTermPattern(term: string, exactMatch: boolean): string {
  const escaped = escapeRegExp(term);
  if (!exactMatch) return escaped;

  const firstChar = term.charAt(0);
  const lastChar = term.charAt(term.length - 1);
  const prefix = WORD_CHAR_RE.test(firstChar) ? "\\b" : "";
  const suffix = WORD_CHAR_RE.test(lastChar) ? "\\b" : "";
  return `${prefix}${escaped}${suffix}`;
}

/**
 * Splits `text` into matched and unmatched chunks for `<c-highlight>`.
 *
 * - Accepts a single `query` string or an array of query strings.
 * - Sorts multi-term queries longest-first so overlapping terms match cleanly.
 * - Safely escapes RegExp metacharacters.
 */
export function highlightWords(
  rawText: string | number | null | undefined,
  rawQuery: string | ReadonlyArray<string> | null | undefined,
  options: HighlightOptions = {},
): HighlightChunk[] {
  const text = rawText === null || rawText === undefined ? "" : String(rawText);
  if (!text) return [];

  const ignoreCase = options.ignoreCase !== false;
  const matchAll = options.matchAll !== false;
  const exactMatch = Boolean(options.exactMatch);

  const rawList = Array.isArray(rawQuery)
    ? rawQuery
    : typeof rawQuery === "string"
      ? [rawQuery]
      : [];

  const terms: string[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < rawList.length; i++) {
    const item = rawList[i];
    if (typeof item !== "string" || item.length === 0) continue;
    const dedupeKey = ignoreCase ? item.toLowerCase() : item;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    terms.push(item);
  }

  if (terms.length === 0) {
    return [{ text, match: false }];
  }

  // Sort longest-first so longer overlapping queries take precedence
  terms.sort((a, b) => b.length - a.length);

  const pattern = terms
    .map((term) => buildTermPattern(term, exactMatch))
    .join("|");
  const flags = `${matchAll ? "g" : ""}${ignoreCase ? "i" : ""}`;
  const regex = new RegExp(pattern, flags);

  const chunks: HighlightChunk[] = [];
  let lastIndex = 0;

  if (matchAll) {
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      const matchedText = match[0];
      if (matchedText.length === 0) {
        regex.lastIndex++;
        continue;
      }
      if (match.index > lastIndex) {
        chunks.push({
          text: text.slice(lastIndex, match.index),
          match: false,
        });
      }
      chunks.push({ text: matchedText, match: true });
      lastIndex = match.index + matchedText.length;
    }
  } else {
    const match = regex.exec(text);
    if (match && match[0].length > 0) {
      if (match.index > 0) {
        chunks.push({ text: text.slice(0, match.index), match: false });
      }
      chunks.push({ text: match[0], match: true });
      lastIndex = match.index + match[0].length;
    }
  }

  if (lastIndex < text.length) {
    chunks.push({ text: text.slice(lastIndex), match: false });
  }

  return chunks.length > 0 ? chunks : [{ text, match: false }];
}
