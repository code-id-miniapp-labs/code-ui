import type {
  TourContentSize,
  TourPlacement,
  TourPositionResult,
  TourRect,
  TourResolvedSide,
  TourSpotlightResult,
  TourStepType,
  TourViewport,
} from "./tour.types";

const DEFAULT_VIEWPORT: TourViewport = {
  width: 375,
  height: 667,
  safeTop: 0,
  safeBottom: 0,
};

const ARROW_ROTATE_STYLE =
  "-webkit-transform: rotate(45deg); transform: rotate(45deg);";

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

export function readViewportSize(): TourViewport {
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

export interface ComputeTourSpotlightParams {
  targetRect: TourRect | null;
  viewport: TourViewport;
  stepType: TourStepType;
  spotlightOffset: number;
  spotlightRadius: number | null;
  targetRadius?: number | null | undefined;
  preventInteraction: boolean;
  showBackdrop?: boolean | undefined;
}

const EMPTY_SPOTLIGHT: TourSpotlightResult = {
  visible: false,
  rect: null,
  spotlightStyle: "",
  backdropTopStyle: "",
  backdropBottomStyle: "",
  backdropLeftStyle: "",
  backdropRightStyle: "",
};

export function parseComputedBorderRadius(
  rawValue: unknown,
  width: number,
  height: number,
): number | null {
  if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
    return Math.max(0, rawValue);
  }
  if (typeof rawValue !== "string") return null;
  const firstToken = rawValue.trim().split(/[\s/]+/)[0];
  if (!firstToken) return null;

  if (firstToken.endsWith("%")) {
    const pct = Number.parseFloat(firstToken);
    if (!Number.isFinite(pct) || pct <= 0) return 0;
    const minSide = Math.min(width, height);
    return Math.max(0, (pct / 100) * minSide);
  }

  const num = Number.parseFloat(firstToken);
  if (!Number.isFinite(num)) return null;
  return Math.max(0, num);
}

export function computeTourSpotlight(
  params: ComputeTourSpotlightParams,
): TourSpotlightResult {
  const {
    targetRect,
    viewport,
    stepType,
    spotlightOffset,
    spotlightRadius,
    targetRadius = null,
    preventInteraction,
    showBackdrop = true,
  } = params;

  if (!targetRect || (stepType !== "tooltip" && stepType !== "wait")) {
    return EMPTY_SPOTLIGHT;
  }

  const offset = Math.max(0, spotlightOffset);

  const left = clamp(targetRect.left - offset, 0, viewport.width);
  const top = clamp(targetRect.top - offset, 0, viewport.height);
  const right = clamp(targetRect.right + offset, left, viewport.width);
  const bottom = clamp(targetRect.bottom + offset, top, viewport.height);
  const width = Math.max(0, right - left);
  const height = Math.max(0, bottom - top);

  if (width <= 0 || height <= 0) {
    return EMPTY_SPOTLIGHT;
  }

  const maxRadius = Math.floor(Math.min(width, height) / 2);
  let radius: number;
  if (typeof spotlightRadius === "number" && Number.isFinite(spotlightRadius)) {
    radius = clamp(spotlightRadius, 0, maxRadius);
  } else if (typeof targetRadius === "number" && targetRadius > 0) {
    // Concentric radius around the detected rounded target
    radius = clamp(Math.round(targetRadius + offset * 0.5), 0, maxRadius);
  } else {
    radius = 0;
  }

  const pointerEvents = preventInteraction ? "auto" : "none";
  const spread = Math.ceil(Math.max(viewport.width, viewport.height, 800) * 1.5);
  const backdropShadow = showBackdrop
    ? ` box-shadow: 0 0 0 ${spread}px var(--cui-tour-backdrop, rgba(0, 0, 0, 0.55));`
    : "";

  return {
    visible: true,
    rect: { left, top, right, bottom, width, height },
    spotlightStyle: `left: ${roundPx(left)}px; top: ${roundPx(top)}px; width: ${roundPx(width)}px; height: ${roundPx(height)}px; border-radius: ${roundPx(radius)}px; pointer-events: ${pointerEvents};${backdropShadow}`,
    backdropTopStyle: `top: 0px; left: 0px; right: 0px; height: ${roundPx(top)}px;`,
    backdropBottomStyle: `top: ${roundPx(bottom)}px; left: 0px; right: 0px; bottom: 0px;`,
    backdropLeftStyle: `top: ${roundPx(top)}px; left: 0px; width: ${roundPx(left)}px; height: ${roundPx(height)}px;`,
    backdropRightStyle: `top: ${roundPx(top)}px; left: ${roundPx(right)}px; right: 0px; height: ${roundPx(height)}px;`,
  };
}

function parsePlacement(placement: TourPlacement): {
  side: TourResolvedSide;
  align: "start" | "center" | "end";
} {
  if (placement === "center") return { side: "center", align: "center" };
  if (placement === "left") return { side: "left", align: "center" };
  if (placement === "right") return { side: "right", align: "center" };
  if (placement === "top-start") return { side: "top", align: "start" };
  if (placement === "top-end") return { side: "top", align: "end" };
  if (placement === "top") return { side: "top", align: "center" };
  if (placement === "bottom-start") return { side: "bottom", align: "start" };
  if (placement === "bottom-end") return { side: "bottom", align: "end" };
  return { side: "bottom", align: "center" };
}

export interface ComputeTourPositionParams {
  stepType: TourStepType;
  hasTarget: boolean;
  hasCardContent: boolean;
  measureResolved: boolean;
  targetRect: TourRect | null;
  spotlightRect: TourRect | null;
  viewport: TourViewport;
  contentSize: TourContentSize | null;
  placement: TourPlacement;
  arrow: boolean;
  sideOffset: number;
  collisionPadding: number;
  avoidCollisions: boolean;
  maxWidth: number;
}

export function computeTourPosition(
  params: ComputeTourPositionParams,
): TourPositionResult {
  const {
    stepType,
    hasTarget,
    hasCardContent,
    measureResolved,
    targetRect,
    spotlightRect,
    viewport,
    contentSize,
    placement,
    arrow,
    sideOffset,
    collisionPadding,
    avoidCollisions,
    maxWidth,
  } = params;

  const pad = Math.max(0, collisionPadding);
  const safeTop = viewport.safeTop ?? 0;
  const safeBottom = viewport.safeBottom ?? 0;
  const maxAllowedWidth = Math.max(
    180,
    Math.min(maxWidth, viewport.width - pad * 2),
  );

  if (stepType === "wait" && !hasCardContent) {
    return {
      positioned: false,
      resolvedSide: "center",
      showArrow: false,
      positionerStyle: "opacity: 0; pointer-events: none;",
      arrowStyle: "",
    };
  }

  // Dialog mode (or tooltip with no target / target not found fallback)
  if (
    stepType === "dialog" ||
    ((stepType === "tooltip" || stepType === "wait") && !hasTarget)
  ) {
    const widthStyle = `width: ${roundPx(maxAllowedWidth)}px; max-width: ${roundPx(maxAllowedWidth)}px;`;
    return {
      positioned: true,
      resolvedSide: "center",
      showArrow: false,
      positionerStyle: `top: 50%; left: 50%; -webkit-transform: translate(-50%, -50%); transform: translate(-50%, -50%); ${widthStyle}`,
      arrowStyle: "",
    };
  }

  // Floating mode: anchored to viewport edge or center
  if (stepType === "floating") {
    const { side, align } = parsePlacement(placement);
    const widthStyle = `width: ${roundPx(maxAllowedWidth)}px; max-width: ${roundPx(maxAllowedWidth)}px;`;

    if (side === "center") {
      return {
        positioned: true,
        resolvedSide: "center",
        showArrow: false,
        positionerStyle: `top: 50%; left: 50%; -webkit-transform: translate(-50%, -50%); transform: translate(-50%, -50%); ${widthStyle}`,
        arrowStyle: "",
      };
    }

    const verticalStyle =
      side === "top"
        ? `top: ${roundPx(safeTop + pad)}px;`
        : `bottom: ${roundPx(safeBottom + pad)}px;`;

    const horizontalStyle =
      align === "start"
        ? `left: ${roundPx(pad)}px;`
        : align === "end"
          ? `right: ${roundPx(pad)}px;`
          : "left: 50%; -webkit-transform: translateX(-50%); transform: translateX(-50%);";

    return {
      positioned: true,
      resolvedSide: side === "top" ? "top" : "bottom",
      showArrow: false,
      positionerStyle: `${verticalStyle} ${horizontalStyle} ${widthStyle}`.trim(),
      arrowStyle: "",
    };
  }

  // Tooltip / Wait with target selector
  const anchor = spotlightRect ?? targetRect;
  if (!anchor) {
    if (measureResolved) {
      const widthStyle = `width: ${roundPx(maxAllowedWidth)}px; max-width: ${roundPx(maxAllowedWidth)}px;`;
      return {
        positioned: true,
        resolvedSide: "center",
        showArrow: false,
        positionerStyle: `top: 50%; left: 50%; -webkit-transform: translate(-50%, -50%); transform: translate(-50%, -50%); ${widthStyle}`,
        arrowStyle: "",
      };
    }
    return {
      positioned: false,
      resolvedSide: "bottom",
      showArrow: false,
      positionerStyle: `opacity: 0; pointer-events: none; left: ${roundPx(pad)}px; top: ${roundPx(safeTop + pad)}px; width: ${roundPx(maxAllowedWidth)}px;`,
      arrowStyle: "",
    };
  }

  const showArrow = Boolean(arrow);
  const gap = Math.max(0, sideOffset) + (showArrow ? 6 : 0);
  const parsed = parsePlacement(placement);
  const preferredSide = parsed.side === "center" ? "bottom" : parsed.side;
  const align = parsed.align;

  const estHeight =
    contentSize?.height && contentSize.height > 0 ? contentSize.height : 180;
  const cardWidth =
    contentSize?.width && contentSize.width > 0
      ? Math.min(contentSize.width, maxAllowedWidth)
      : maxAllowedWidth;

  const spaceBelow = Math.max(
    0,
    viewport.height - safeBottom - pad - (anchor.bottom + gap),
  );
  const spaceAbove = Math.max(0, anchor.top - gap - (safeTop + pad));
  const spaceRight = Math.max(0, viewport.width - pad - (anchor.right + gap));
  const spaceLeft = Math.max(0, anchor.left - gap - pad);

  let resolvedSide: TourResolvedSide = preferredSide;
  if (avoidCollisions) {
    if (
      preferredSide === "bottom" &&
      spaceBelow < estHeight &&
      spaceAbove > spaceBelow
    ) {
      resolvedSide = "top";
    } else if (
      preferredSide === "top" &&
      spaceAbove < estHeight &&
      spaceBelow > spaceAbove
    ) {
      resolvedSide = "bottom";
    } else if (preferredSide === "right") {
      if (spaceRight < Math.min(cardWidth, 200)) {
        if (spaceLeft >= Math.min(cardWidth, 200)) {
          resolvedSide = "left";
        } else {
          resolvedSide = spaceBelow >= spaceAbove ? "bottom" : "top";
        }
      }
    } else if (preferredSide === "left") {
      if (spaceLeft < Math.min(cardWidth, 200)) {
        if (spaceRight >= Math.min(cardWidth, 200)) {
          resolvedSide = "right";
        } else {
          resolvedSide = spaceBelow >= spaceAbove ? "bottom" : "top";
        }
      }
    }
  }

  // Horizontal sides (left / right)
  if (resolvedSide === "left" || resolvedSide === "right") {
    const availW = resolvedSide === "right" ? spaceRight : spaceLeft;
    const sideCardWidth = Math.max(160, Math.min(cardWidth, availW));
    const anchorCenterY = anchor.top + anchor.height / 2;
    const rawTop = anchorCenterY - estHeight / 2;
    const minTop = safeTop + pad;
    const maxTop = Math.max(
      minTop,
      viewport.height - safeBottom - pad - estHeight,
    );
    const resolvedTop = avoidCollisions ? clamp(rawTop, minTop, maxTop) : rawTop;

    const horizontalStyle =
      resolvedSide === "right"
        ? `left: ${roundPx(anchor.right + gap)}px;`
        : `right: ${roundPx(viewport.width - anchor.left + gap)}px;`;

    const arrowTop = clamp(
      anchorCenterY - resolvedTop - 5,
      14,
      Math.max(14, estHeight - 24),
    );
    const arrowHorizontal =
      resolvedSide === "right" ? "left: -5px;" : "right: -5px;";

    return {
      positioned: true,
      resolvedSide,
      showArrow,
      positionerStyle: `top: ${roundPx(resolvedTop)}px; ${horizontalStyle} width: ${roundPx(sideCardWidth)}px; max-width: ${roundPx(maxAllowedWidth)}px;`,
      arrowStyle: showArrow
        ? `top: ${roundPx(arrowTop)}px; ${arrowHorizontal} ${ARROW_ROTATE_STYLE}`
        : "",
    };
  }

  // Vertical sides (bottom / top)
  const anchorCenterX = anchor.left + anchor.width / 2;
  const rawLeft =
    align === "start"
      ? anchor.left
      : align === "end"
        ? anchor.right - cardWidth
        : anchorCenterX - cardWidth / 2;
  const maxLeft = Math.max(pad, viewport.width - pad - cardWidth);
  const resolvedLeft = avoidCollisions ? clamp(rawLeft, pad, maxLeft) : rawLeft;

  let verticalStyle: string;
  if (resolvedSide === "bottom") {
    const rawTop = anchor.bottom + gap;
    const maxTop = Math.max(
      safeTop + pad,
      viewport.height - safeBottom - pad - Math.min(estHeight, 120),
    );
    const clampedTop = avoidCollisions ? Math.min(rawTop, maxTop) : rawTop;
    verticalStyle = `top: ${roundPx(clampedTop)}px;`;
  } else {
    const rawBottom = viewport.height - anchor.top + gap;
    const maxBottom = Math.max(
      safeBottom + pad,
      viewport.height - safeTop - pad - Math.min(estHeight, 120),
    );
    const clampedBottom = avoidCollisions
      ? Math.min(rawBottom, maxBottom)
      : rawBottom;
    verticalStyle = `bottom: ${roundPx(clampedBottom)}px;`;
  }

  const arrowLeft = clamp(
    anchorCenterX - resolvedLeft - 5,
    16,
    Math.max(16, cardWidth - 26),
  );
  const arrowVertical = resolvedSide === "bottom" ? "top: -5px;" : "bottom: -5px;";

  return {
    positioned: true,
    resolvedSide,
    showArrow,
    positionerStyle: `${verticalStyle} left: ${roundPx(resolvedLeft)}px; width: ${roundPx(cardWidth)}px; max-width: ${roundPx(maxAllowedWidth)}px;`,
    arrowStyle: showArrow
      ? `${arrowVertical} left: ${roundPx(arrowLeft)}px; ${ARROW_ROTATE_STYLE}`
      : "",
  };
}
