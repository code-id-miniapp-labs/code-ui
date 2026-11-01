import { createAnatomy } from "@code-ui/anatomy";

export const anatomy = createAnatomy("slider").parts(
  "root",
  "label",
  "valueText",
  "wrapper",
  "control",
  "track",
  "range",
  "thumb",
  "markerGroup",
  "marker",
  "markerTick",
  "markerLabel",
);

export const parts = anatomy.build();

