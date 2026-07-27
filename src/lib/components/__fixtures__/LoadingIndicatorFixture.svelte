<script lang="ts">
  import type { DocsLoadingIndicatorProps } from '../loadingIndicator.ts';

  let { ariaHidden = false, size, thickness }: DocsLoadingIndicatorProps = $props();
</script>

<span
  data-testid="loading-indicator"
  data-size={size}
  data-thickness={thickness}
  aria-hidden={ariaHidden ? 'true' : undefined}
></span>
