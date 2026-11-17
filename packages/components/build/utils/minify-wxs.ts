const WXS_RESERVED = new Set([
  "break",
  "case",
  "catch",
  "continue",
  "default",
  "delete",
  "do",
  "else",
  "false",
  "finally",
  "for",
  "function",
  "if",
  "in",
  "instanceof",
  "new",
  "null",
  "return",
  "switch",
  "this",
  "throw",
  "true",
  "try",
  "typeof",
  "undefined",
  "var",
  "void",
  "while",
  "arguments",
  "module",
  "exports",
  "require",
  "Math",
  "Number",
  "String",
  "Boolean",
  "Array",
  "Object",
  "Date",
  "JSON",
  "RegExp",
  "parseInt",
  "parseFloat",
  "isNaN",
  "isFinite",
  "getDate",
  "getRegExp",
  "console",
  "Infinity",
  "NaN",
]);

const WXS_IDENT_CHARS =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$";

/**
 * Tokenizes, mangles local declarations, and minifies ES5 WXS source code.
 */
export function minifyWxs(source: string): string {
  type Tok = { k: "s" | "i" | "o"; v: string };
  const tokens: Tok[] = [];
  let i = 0;
  const n = source.length;

  while (i < n) {
    const ch = source[i] ?? "";
    if (ch === "/" && source[i + 1] === "*") {
      const end = source.indexOf("*/", i + 2);
      i = end === -1 ? n : end + 2;
      continue;
    }
    if (ch === "/" && source[i + 1] === "/") {
      const end = source.indexOf("\n", i + 2);
      i = end === -1 ? n : end + 1;
      continue;
    }
    if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
      i++;
      continue;
    }
    if (ch === "'" || ch === '"') {
      let s = ch;
      i++;
      while (i < n) {
        const c = source[i] ?? "";
        s += c;
        i++;
        if (c === "\\") {
          if (i < n) {
            s += source[i] ?? "";
            i++;
          }
          continue;
        }
        if (c === ch) break;
      }
      tokens.push({ k: "s", v: s });
      continue;
    }
    if (/[A-Za-z_$]/.test(ch)) {
      let id = ch;
      i++;
      while (i < n && /[A-Za-z0-9_$]/.test(source[i] ?? "")) {
        id += source[i] ?? "";
        i++;
      }
      tokens.push({ k: "i", v: id });
      continue;
    }
    if (/[0-9]/.test(ch) || (ch === "." && /[0-9]/.test(source[i + 1] ?? ""))) {
      let num = ch;
      i++;
      while (i < n && /[0-9a-fA-FxX._eE+-]/.test(source[i] ?? "")) {
        const c = source[i] ?? "";
        if ((c === "+" || c === "-") && !/[eE]/.test(num[num.length - 1] ?? "")) {
          break;
        }
        num += c;
        i++;
      }
      tokens.push({ k: "o", v: num });
      continue;
    }

    const three = source.slice(i, i + 3);
    const two = source.slice(i, i + 2);
    if (
      three === "===" ||
      three === "!==" ||
      three === ">>>" ||
      three === "<<=" ||
      three === ">>="
    ) {
      tokens.push({ k: "o", v: three });
      i += 3;
    } else if (
      two === "==" ||
      two === "!=" ||
      two === "<=" ||
      two === ">=" ||
      two === "&&" ||
      two === "||" ||
      two === "++" ||
      two === "--" ||
      two === "+=" ||
      two === "-=" ||
      two === "*=" ||
      two === "/=" ||
      two === "%=" ||
      two === "<<" ||
      two === ">>"
    ) {
      tokens.push({ k: "o", v: two });
      i += 2;
    } else {
      tokens.push({ k: "o", v: ch });
      i++;
    }
  }

  const counts = new Map<string, number>();
  const markDecl = (name: string) => {
    if (!WXS_RESERVED.has(name)) counts.set(name, (counts.get(name) ?? 0) + 1);
  };

  for (let t = 0; t < tokens.length; t++) {
    const tok = tokens[t];
    if (!tok || tok.k !== "i") continue;
    if (tok.v === "function") {
      let p = t + 1;
      if (tokens[p]?.k === "i") {
        markDecl(tokens[p]?.v ?? "");
        p++;
      }
      if (tokens[p]?.v === "(") {
        p++;
        while (p < tokens.length && tokens[p]?.v !== ")") {
          if (tokens[p]?.k === "i") markDecl(tokens[p]?.v ?? "");
          p++;
        }
      }
    } else if (tok.v === "var") {
      let p = t + 1;
      let depth = 0;
      while (p < tokens.length) {
        const v = tokens[p]?.v ?? "";
        if (depth === 0 && (v === ";" || v === "in")) break;
        if (v === "(" || v === "[" || v === "{") depth++;
        else if (v === ")" || v === "]" || v === "}") {
          if (depth === 0) break;
          depth--;
        } else if (
          depth === 0 &&
          tokens[p]?.k === "i" &&
          (p === t + 1 || tokens[p - 1]?.v === ",")
        ) {
          markDecl(v);
        }
        p++;
      }
    }
  }

  for (const tok of tokens) {
    if (tok?.k === "i" && counts.has(tok.v)) {
      counts.set(tok.v, (counts.get(tok.v) ?? 0) + 1);
    }
  }

  const sorted = [...counts.entries()].toSorted((a, b) => b[1] - a[1]);
  const rename = new Map<string, string>();
  let nameIdx = 0;
  const nextShortName = (): string => {
    while (true) {
      let idx = nameIdx++;
      let s = WXS_IDENT_CHARS[idx % WXS_IDENT_CHARS.length] ?? "a";
      idx = Math.floor(idx / WXS_IDENT_CHARS.length);
      while (idx > 0) {
        s += WXS_IDENT_CHARS[(idx - 1) % WXS_IDENT_CHARS.length] ?? "a";
        idx = Math.floor((idx - 1) / WXS_IDENT_CHARS.length);
      }
      if (!WXS_RESERVED.has(s)) return s;
    }
  };
  for (const [orig] of sorted) rename.set(orig, nextShortName());

  let out = "";
  for (let t = 0; t < tokens.length; t++) {
    const tok = tokens[t];
    if (!tok) continue;
    let val = tok.v;
    if (tok.k === "i" && rename.has(val)) {
      const prev = tokens[t - 1]?.v;
      const next = tokens[t + 1]?.v;
      const isMember = prev === ".";
      const isObjKey = next === ":" && (prev === "{" || prev === ",");
      if (!isMember && !isObjKey) {
        val = rename.get(val) ?? val;
      }
    }
    if ((val === "}" || val === "]") && out.endsWith(",")) {
      out = out.slice(0, -1);
    }
    const prevChar = out[out.length - 1] ?? "";
    const firstChar = val[0] ?? "";
    if (
      prevChar &&
      ((/[A-Za-z0-9_$]/.test(prevChar) && /[A-Za-z0-9_$]/.test(firstChar)) ||
        (prevChar === "+" && firstChar === "+") ||
        (prevChar === "-" && firstChar === "-"))
    ) {
      out += " ";
    }
    out += val;
  }
  return out;
}
