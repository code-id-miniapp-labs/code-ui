import { createAnatomy } from "@code-id-labs/anatomy";

export const anatomy = createAnatomy("presence").parts("root");

export const parts = anatomy.build();
