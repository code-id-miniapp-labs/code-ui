import { optPartId, partId, type Scope } from "@code-ui/core";

export const getRootId = (scope: Scope) => partId(scope, "qr", "root", "r");

export const getFrameId = (scope: Scope) => optPartId(scope, "frame");

export const getPatternId = (scope: Scope) => optPartId(scope, "pattern");

export const getOverlayId = (scope: Scope) => optPartId(scope, "overlay");
