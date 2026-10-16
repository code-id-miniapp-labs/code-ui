import { describe, expect, it } from "vitest";
import { cleanKeyframes } from "../src/core/utils";

describe("cleanKeyframes", () => {
  it("deduplicates repeated @keyframes blocks", () => {
    const input = `
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@keyframes pulse {
  50% {
    opacity: 0.5;
  }
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@keyframes pulse {
  50% {
    opacity: 0.5;
  }
}
`;
    const output = cleanKeyframes(input);
    const matches = output.match(/@keyframes\s+([a-zA-Z0-9_-]+)/g);
    expect(matches).toEqual(["@keyframes spin", "@keyframes pulse"]);
  });

  it("handles complex multi-stop keyframes correctly", () => {
    const input = `
@keyframes bounce {
  0%, 100% {
    transform: translateY(-25%);
    animation-timing-function: cubic-bezier(.8,0,1,1);
  }
  50% {
    transform: none;
    animation-timing-function: cubic-bezier(0,0,.2,1);
  }
}
@keyframes bounce {
  0% { transform: none; }
}
`;
    const output = cleanKeyframes(input);
    const matches = output.match(/@keyframes\s+([a-zA-Z0-9_-]+)/g);
    expect(matches).toEqual(["@keyframes bounce"]);
    expect(output).toContain(
      "animation-timing-function: cubic-bezier(.8,0,1,1)",
    );
  });
});
