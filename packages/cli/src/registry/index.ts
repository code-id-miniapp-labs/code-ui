import { buttonComponent } from "./components/button";
import { drawerComponent } from "./components/drawer";

export interface RegistryItem {
  name: string;
  description: string;
  dependencies: string[];
  files: Array<{
    name: string;
    content: string;
  }>;
}

export const registry: Record<string, RegistryItem> = {
  button: buttonComponent,
  drawer: drawerComponent,
};

export function getRegistryItem(name: string): RegistryItem | null {
  return registry[name] || null;
}

export function listRegistryItems(): RegistryItem[] {
  return Object.values(registry);
}
