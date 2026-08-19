// ─────────────────────────────────────────────────────────────────────────────
// cx.ts — lightweight class name composition & conditional utility
// ─────────────────────────────────────────────────────────────────────────────

export type ClassValue =
  | string
  | number
  | boolean
  | undefined
  | null
  | Record<string, any>
  | ClassValue[];

function toVal(mix: ClassValue): string {
  let str = "";

  if (typeof mix === "string" || typeof mix === "number") {
    str += mix;
  } else if (typeof mix === "object") {
    if (Array.isArray(mix)) {
      for (let k = 0; k < mix.length; k++) {
        if (mix[k]) {
          const y = toVal(mix[k]);
          if (y) {
            str && (str += " ");
            str += y;
          }
        }
      }
    } else if (mix) {
      for (const k in mix) {
        if (mix[k]) {
          str && (str += " ");
          str += k;
        }
      }
    }
  }

  return str;
}

/**
 * Combines class names, filtering out falsy values.
 *
 * @example
 * cx('btn', true && 'btn--primary', false && 'btn--disabled', { 'is-active': true })
 * // => 'btn btn--primary is-active'
 */
export function cx(...args: ClassValue[]): string {
  let i = 0;
  let tmp: ClassValue;
  let str = "";
  while (i < args.length) {
    if ((tmp = args[i++])) {
      const x = toVal(tmp);
      if (x) {
        str && (str += " ");
        str += x;
      }
    }
  }
  return str;
}
