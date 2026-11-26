import type { TourResolvedProps } from "./tour.types";

export const defaultTourProps: TourResolvedProps = {
  steps: [],
  stepId: null,
  defaultStepId: null,
  open: null,
  defaultOpen: false,
  closeOnInteractOutside: true,
  preventInteraction: false,
  spotlightOffset: 8,
  spotlightRadius: null,
  sideOffset: 10,
  collisionPadding: 16,
  avoidCollisions: true,
  maxWidth: 320,
  autoScroll: true,
  duration: 200,
  transition: true,
};
