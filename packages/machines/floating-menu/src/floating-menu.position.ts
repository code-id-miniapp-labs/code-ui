import type {
  FloatingAlign,
  FloatingContentSize,
  FloatingMatchWidth,
  FloatingPositionResult,
  FloatingRect,
  FloatingSide,
  FloatingViewport,
} from "./floating-menu.types";

const DEFAULT_VIEWPORT: FloatingViewport = {
  width: 375,
  height: 667,
  safeTop: 0,
  safeBottom: 0,
};

function roundPx(value: number): number {
  return Math.round(value * 100) / 100;
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

interface WxWindowApi {
  getWindowInfo?: () => {
    windowWidth?: number;
    windowHeight?: number;
    safeArea?: { top?: number; bottom?: number };
  };
  getSystemInfoSync?: () => {
    windowWidth?: number;
    windowHeight?: number;
    safeArea?: { top?: number; bottom?: number };
  };
}

export function readViewportSize(): FloatingViewport {
  const wxApi = (globalThis as { wx?: WxWindowApi }).wx;
  if (!wxApi) return DEFAULT_VIEWPORT;

  try {
    const info = wxApi.getWindowInfo?.() ?? wxApi.getSystemInfoSync?.();
    if (!info || !info.windowWidth || !info.windowHeight) {
      return DEFAULT_VIEWPORT;
    }
    const height = info.windowHeight;
    const safeTop = info.safeArea?.top ?? 0;
    const safeBottom =
      info.safeArea?.bottom && info.safeArea.bottom <= height
        ? Math.max(0, height - info.safeArea.bottom)
        : 0;
    return {
      width: info.windowWidth,
      height,
      safeTop,
      safeBottom,
    };
  } catch {
    return DEFAULT_VIEWPORT;
  }
}

export interface ComputeFloatingPositionParams {
  anchorRect: FloatingRect | null;
  viewport: FloatingViewport;
  contentSize?: FloatingContentSize | null | undefined;
  portal: boolean;
  side: FloatingSide;
  align: FloatingAlign;
  sideOffset: number;
  alignOffset: number;
  collisionPadding: number;
  avoidCollisions: boolean;
  matchTriggerWidth: FloatingMatchWidth;
  maxHeight: number;
}

export function computeFloatingPosition(
  params: ComputeFloatingPositionParams,
): FloatingPositionResult {
  const {
    anchorRect,
    viewport,
    contentSize,
    portal,
    side,
    align,
    sideOffset,
    alignOffset,
    collisionPadding,
    avoidCollisions,
    matchTriggerWidth,
    maxHeight,
  } = params;

  const safeMaxHeight = Math.max(80, maxHeight);

  if (!portal) {
    const vertical =
      side === "top"
        ? `bottom: calc(100% + ${roundPx(sideOffset)}px);`
        : `top: calc(100% + ${roundPx(sideOffset)}px);`;

    const horizontal =
      align === "end"
        ? `right: ${roundPx(alignOffset)}px;`
        : align === "center"
          ? "left: 50%; transform: translateX(-50%);"
          : `left: ${roundPx(alignOffset)}px;`;

    const widthStyle =
      matchTriggerWidth === true || matchTriggerWidth === "exact"
        ? "width: 100%;"
        : matchTriggerWidth === "min"
          ? "min-width: 100%;"
          : "";

    const origin = side === "top" ? "bottom center" : "top center";
    const arrowVertical = side === "top" ? "bottom: -5px;" : "top: -5px;";
    const arrowHorizontal =
      align === "end"
        ? "right: 16px;"
        : align === "center"
          ? "left: 50%; margin-left: -5px;"
          : "left: 16px;";

    return {
      positioned: true,
      resolvedSide: side,
      resolvedAlign: align,
      maxHeight: safeMaxHeight,
      positionerStyle: `${vertical} ${horizontal} ${widthStyle}`.trim(),
      contentStyle: `max-height: ${roundPx(safeMaxHeight)}px; transform-origin: ${origin};`,
      arrowStyle: `${arrowVertical} ${arrowHorizontal}`,
    };
  }

  if (!anchorRect) {
    return {
      positioned: false,
      resolvedSide: side,
      resolvedAlign: align,
      maxHeight: safeMaxHeight,
      positionerStyle: "opacity: 0; pointer-events: none; left: 0px; top: 0px;",
      contentStyle: `max-height: ${roundPx(safeMaxHeight)}px;`,
      arrowStyle: "",
    };
  }

  const pad = Math.max(0, collisionPadding);
  const safeTop = viewport.safeTop ?? 0;
  const safeBottom = viewport.safeBottom ?? 0;

  const spaceBelow = Math.max(
    0,
    viewport.height - safeBottom - pad - (anchorRect.bottom + sideOffset),
  );
  const spaceAbove = Math.max(
    0,
    anchorRect.top - sideOffset - (safeTop + pad),
  );

  const desiredHeight = contentSize?.height
    ? Math.min(contentSize.height, safeMaxHeight)
    : Math.min(safeMaxHeight, 160);

  let resolvedSide: FloatingSide = side;
  if (avoidCollisions) {
    if (
      side === "bottom" &&
      spaceBelow < desiredHeight &&
      spaceAbove > spaceBelow
    ) {
      resolvedSide = "top";
    } else if (
      side === "top" &&
      spaceAbove < desiredHeight &&
      spaceBelow > spaceAbove
    ) {
      resolvedSide = "bottom";
    }
  }

  const availableSpace = resolvedSide === "bottom" ? spaceBelow : spaceAbove;
  const resolvedMaxHeight = avoidCollisions
    ? Math.max(80, Math.min(safeMaxHeight, Math.floor(availableSpace)))
    : safeMaxHeight;

  const verticalStyle =
    resolvedSide === "bottom"
      ? `top: ${roundPx(anchorRect.bottom + sideOffset)}px;`
      : `bottom: ${roundPx(viewport.height - anchorRect.top + sideOffset)}px;`;

  const maxAllowedWidth = Math.max(120, viewport.width - pad * 2);
  let widthStyle = `max-width: ${roundPx(maxAllowedWidth)}px;`;
  let knownWidth: number | undefined;

  if (matchTriggerWidth === true || matchTriggerWidth === "exact") {
    knownWidth = Math.min(anchorRect.width, maxAllowedWidth);
    widthStyle = `width: ${roundPx(knownWidth)}px; max-width: ${roundPx(maxAllowedWidth)}px;`;
  } else if (matchTriggerWidth === "min") {
    const minW = Math.min(anchorRect.width, maxAllowedWidth);
    widthStyle = `min-width: ${roundPx(minW)}px; max-width: ${roundPx(maxAllowedWidth)}px;`;
    if (contentSize?.width) {
      knownWidth = clamp(contentSize.width, minW, maxAllowedWidth);
    } else {
      knownWidth = minW;
    }
  } else if (contentSize?.width) {
    knownWidth = Math.min(contentSize.width, maxAllowedWidth);
  }

  let horizontalStyle = "";
  let resolvedLeft: number | undefined;

  if (knownWidth !== undefined) {
    const rawLeft =
      align === "end"
        ? anchorRect.right - knownWidth + alignOffset
        : align === "center"
          ? anchorRect.left + anchorRect.width / 2 - knownWidth / 2 + alignOffset
          : anchorRect.left + alignOffset;
    resolvedLeft = avoidCollisions
      ? clamp(rawLeft, pad, Math.max(pad, viewport.width - pad - knownWidth))
      : rawLeft;
    horizontalStyle = `left: ${roundPx(resolvedLeft)}px;`;
  } else if (align === "end") {
    const rawRight = viewport.width - anchorRect.right - alignOffset;
    const clampedRight = avoidCollisions
      ? clamp(rawRight, pad, Math.max(pad, viewport.width - pad - 120))
      : rawRight;
    horizontalStyle = `right: ${roundPx(clampedRight)}px;`;
  } else if (align === "center") {
    const center = anchorRect.left + anchorRect.width / 2 + alignOffset;
    const clampedCenter = avoidCollisions
      ? clamp(center, pad, viewport.width - pad)
      : center;
    horizontalStyle = `left: ${roundPx(clampedCenter)}px; transform: translateX(-50%);`;
  } else {
    const rawLeft = anchorRect.left + alignOffset;
    const clampedLeft = avoidCollisions
      ? clamp(rawLeft, pad, Math.max(pad, viewport.width - pad - 120))
      : rawLeft;
    horizontalStyle = `left: ${roundPx(clampedLeft)}px;`;
  }

  const origin = resolvedSide === "bottom" ? "top center" : "bottom center";
  const arrowVertical = resolvedSide === "bottom" ? "top: -5px;" : "bottom: -5px;";

  let arrowHorizontal = "left: 50%; margin-left: -5px;";
  if (resolvedLeft !== undefined && knownWidth !== undefined) {
    const triggerCenter = anchorRect.left + anchorRect.width / 2;
    const arrowOffset = clamp(
      triggerCenter - resolvedLeft - 5,
      10,
      Math.max(10, knownWidth - 20),
    );
    arrowHorizontal = `left: ${roundPx(arrowOffset)}px;`;
  } else if (align === "start") {
    arrowHorizontal = "left: 16px;";
  } else if (align === "end") {
    arrowHorizontal = "right: 16px;";
  }

  return {
    positioned: true,
    resolvedSide,
    resolvedAlign: align,
    maxHeight: resolvedMaxHeight,
    positionerStyle: `${verticalStyle} ${horizontalStyle} ${widthStyle}`.trim(),
    contentStyle: `max-height: ${roundPx(resolvedMaxHeight)}px; transform-origin: ${origin};`,
    arrowStyle: `${arrowVertical} ${arrowHorizontal}`,
  };
}
