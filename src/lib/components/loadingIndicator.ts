import type { Component } from 'svelte';

export interface DocsLoadingIndicatorProps {
  ariaHidden?: boolean;
  size?: number | string;
  thickness?: number | string;
}

export type DocsLoadingIndicator = Component<DocsLoadingIndicatorProps>;
