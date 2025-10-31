import type { ComponentType } from 'svelte';
import type { DocsLink, DocsSection } from '../utils/navigation';

// Re-export navigation types for convenience
export type { DocsLink, DocsSection };

/**
 * Component prop types
 */

export interface DocsSidebarProps {
  navigation: DocsSection[];
  currentPath?: string;
}

export interface DocsHubProps {
  navigation: DocsSection[];
  title?: string;
  description?: string;
  githubUrl?: string;
}

export interface SurfaceProps {
  variant?: 'base' | 'raised' | 'elevated';
  radius?: 'sm' | 'md' | 'lg' | 'xl';
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  class?: string;
}

export interface ContentProps {
  variant?: 'title' | 'subtitle' | 'body' | 'caption';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: 'primary' | 'secondary' | 'tertiary';
  class?: string;
}

export interface ScreenshotImageProps {
  name: string;
  url: string;
  path: string;
  version: string;
  config?: any;
}
