const BEHAVIOR_MODULES = [
  "stepper",
  "accordion",
  "tabs",
  "select",
  "input-menu",
  "radio",
  "checkbox",
  "app",
  "theme",
  "avatar-group",
  "toast",
] as const;

/**
 * Generates rolldown `codeSplitting.groups` for shared signals and domain behavior subpaths.
 */
export function createCodeSplittingGroups() {
  return [
    {
      name: "alien-signals",
      test: /[\\/]alien-signals[\\/]/,
      includeDependenciesRecursively: false,
    },
    ...BEHAVIOR_MODULES.map((name) => ({
      name: `behaviors/${name}`,
      test: new RegExp(`[\\\\/]behaviors[\\\\/]${name}`),
      includeDependenciesRecursively: false,
      minSize: 0,
    })),
    {
      name: "behaviors/form",
      test: /[\\/]behaviors[\\/]form|[\\/]machines[\\/]form[\\/]dist[\\/]context\.|[\\/]context[\\/]dist[\\/]/,
      includeDependenciesRecursively: false,
      minSize: 0,
    },
  ];
}
