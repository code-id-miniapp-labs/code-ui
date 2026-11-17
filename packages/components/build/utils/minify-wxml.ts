/**
 * Minifies WXML templates while preserving `<text>` inner whitespace and quoted attributes.
 */
export function minifyWxml(source: string): string {
  const noComments = source.replace(/<!--[\s\S]*?-->/g, "");
  let out = "";
  let i = 0;
  const len = noComments.length;
  let textDepth = 0;

  while (i < len) {
    if (noComments[i] === "<") {
      let tag = "<";
      i++;
      let quote = "";
      let prevSpace = false;
      while (i < len) {
        const ch = noComments[i] ?? "";
        i++;
        if (quote) {
          tag += ch;
          if (ch === quote) quote = "";
          continue;
        }
        if (ch === '"' || ch === "'") {
          quote = ch;
          prevSpace = false;
          tag += ch;
          continue;
        }
        if (ch === ">") {
          if (tag.endsWith(" ")) tag = tag.slice(0, -1);
          if (tag.endsWith(" /")) tag = `${tag.slice(0, -2)}/>`;
          else tag += ">";
          break;
        }
        if (ch === " " || ch === "\n" || ch === "\r" || ch === "\t") {
          if (!prevSpace && tag.length > 1) {
            tag += " ";
            prevSpace = true;
          }
          continue;
        }
        prevSpace = false;
        tag += ch;
      }
      if (/^<text(?:\s|>)/.test(tag) && !tag.endsWith("/>")) {
        textDepth++;
      } else if (/^<\/text>$/.test(tag) && textDepth > 0) {
        textDepth--;
      }
      out += tag;
    } else {
      const nextLt = noComments.indexOf("<", i);
      const chunk =
        nextLt === -1 ? noComments.slice(i) : noComments.slice(i, nextLt);
      i = nextLt === -1 ? len : nextLt;
      if (textDepth > 0) {
        out += chunk;
      } else if (chunk.trim().length > 0) {
        out += chunk.replace(/^\s*\n\s*|\s*\n\s*$/g, "");
      }
    }
  }
  return out.trim();
}
