/**
 * Docs Section Icons
 *
 * Navigation crosses a SvelteKit server load, so sections carry an icon *name*
 * rather than a component. This module is the single place those names resolve
 * to components, which is the only layer where a Svelte component is legal.
 *
 * Set one in page frontmatter with `icon: rocket`. A section takes the icon of
 * its lowest-order page.
 */

import {
  BookOpen,
  Compass,
  FileCode2,
  FlaskConical,
  Library,
  Map,
  Package,
  Rocket,
  Settings,
  Shapes,
  Terminal,
  Wrench,
} from '@lucide/svelte';

const sectionIcons = {
  book: BookOpen,
  compass: Compass,
  code: FileCode2,
  flask: FlaskConical,
  library: Library,
  map: Map,
  package: Package,
  rocket: Rocket,
  settings: Settings,
  shapes: Shapes,
  terminal: Terminal,
  wrench: Wrench,
} as const;

export type DocsSectionIconName = keyof typeof sectionIcons;

export const docsSectionIconNames = Object.keys(sectionIcons) as DocsSectionIconName[];

/** Resolve a frontmatter icon name, falling back to a neutral document icon. */
export function resolveDocsSectionIcon(
  iconName?: string
): (typeof sectionIcons)[DocsSectionIconName] {
  if (iconName && iconName in sectionIcons) {
    return sectionIcons[iconName as DocsSectionIconName];
  }
  return BookOpen;
}
