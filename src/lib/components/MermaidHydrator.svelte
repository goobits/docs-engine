<script lang="ts">
  /**
   * Client-side hydrator for mermaid diagrams
   *
   * Finds all .md-mermaid divs and renders them
   * Use this in your layout or page to hydrate static HTML
   */
  import { escapeHtml, useHydrator } from '@goobits/docs-engine/utils';

  interface Props {
    theme?: 'default' | 'dark' | 'forest' | 'neutral';
  }

  let { theme = 'dark' }: Props = $props();

  let mermaidApi: typeof import('mermaid').default | undefined;
  let initialized = false;
  let modalOpen = $state(false);
  let modalSvg = $state('');

  // Zoom and pan state
  let zoom = $state(1);
  let panX = $state(0);
  let panY = $state(0);
  let isDragging = $state(false);
  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartPanX = 0;
  let dragStartPanY = 0;

  function openModal(svg: string) {
    // Mermaid already sanitizes its SVG output
    modalSvg = svg;
    modalOpen = true;
  }

  function closeModal() {
    modalOpen = false;
    modalSvg = '';
    // Reset zoom and pan
    zoom = 1;
    panX = 0;
    panY = 0;
    isDragging = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      closeModal();
    }
  }

  function handleWheel(e: WheelEvent) {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(10, zoom * delta));
    zoom = newZoom;
  }

  function handleMouseDown(e: MouseEvent) {
    if (e.button === 0) {
      // Left click only
      isDragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      dragStartPanX = panX;
      dragStartPanY = panY;
      e.preventDefault();
    }
  }

  function handleMouseMove(e: MouseEvent) {
    if (isDragging) {
      const deltaX = e.clientX - dragStartX;
      const deltaY = e.clientY - dragStartY;
      panX = dragStartPanX + deltaX;
      panY = dragStartPanY + deltaY;
    }
  }

  function handleMouseUp() {
    isDragging = false;
  }

  function zoomIn() {
    zoom = Math.min(10, zoom * 1.2);
  }

  function zoomOut() {
    zoom = Math.max(0.1, zoom / 1.2);
  }

  function resetZoom() {
    zoom = 1;
    panX = 0;
    panY = 0;
  }

  async function renderDiagrams() {
    try {
      if (!mermaidApi) {
        const mermaidModule = await import('mermaid');
        mermaidApi = mermaidModule.default;

        if (!mermaidApi) {
          console.error('Mermaid module loaded but default export is undefined');
          return;
        }
      }

      if (!initialized) {
        mermaidApi.initialize({
          startOnLoad: false,
          theme: theme,
          themeVariables: {
            primaryColor: '#bd93f9',
            primaryTextColor: '#f8f8f2',
            primaryBorderColor: '#6272a4',
            lineColor: '#8be9fd',
            secondaryColor: '#ff79c6',
            tertiaryColor: '#50fa7b',
            background: '#282a36',
            mainBkg: '#282a36',
            textColor: '#f8f8f2',
            fontSize: '16px',
            fontFamily: 'var(--v2-font-mono, ui-monospace, monospace)',
          },
          securityLevel: 'strict',
          logLevel: 'error',
        });
        initialized = true;
      }

      const diagrams = document.querySelectorAll('.md-mermaid[data-diagram]');

      for (const element of diagrams) {
        const encoded = element.getAttribute('data-diagram');
        if (!encoded) {
          console.warn('Mermaid element missing data-diagram attribute');
          continue;
        }

        try {
          const source = atob(encoded);
          const id = `mermaid-${Math.random().toString(36).substring(7)}`;

          const { svg } = await mermaidApi.render(id, source);

          // Wrap SVG in clickable container (Mermaid already sanitizes its SVG output)
          const wrapper = document.createElement('div');
          wrapper.className = 'md-mermaid-clickable';
          wrapper.innerHTML = svg;
          wrapper.style.cursor = 'pointer';
          wrapper.style.transition = 'all 0.2s ease';
          wrapper.setAttribute('role', 'button');
          wrapper.setAttribute('tabindex', '0');

          // Add click handler
          wrapper.addEventListener('click', () => openModal(svg));
          wrapper.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openModal(svg);
            }
          });
          wrapper.addEventListener('mouseenter', () => {
            wrapper.style.transform = 'scale(1.02)';
            wrapper.style.opacity = '0.9';
          });
          wrapper.addEventListener('mouseleave', () => {
            wrapper.style.transform = 'scale(1)';
            wrapper.style.opacity = '1';
          });

          element.innerHTML = '';
          element.appendChild(wrapper);

          // Add hint
          const hint = document.createElement('div');
          hint.className = 'md-mermaid-hint';
          hint.textContent = 'Click to expand';
          hint.style.cssText =
            'text-align: center; margin-top: 0.5rem; font-size: 0.75rem; color: rgba(255, 255, 255, 0.5); opacity: 0; transition: opacity 0.2s ease;';
          element.appendChild(hint);

          element.addEventListener('mouseenter', () => {
            hint.style.opacity = '1';
          });
          element.addEventListener('mouseleave', () => {
            hint.style.opacity = '0';
          });

          element.classList.add('md-mermaid--rendered');
          element.removeAttribute('data-diagram');
        } catch (err) {
          console.error('Failed to render mermaid diagram:', err);
          const errorMsg = err instanceof Error ? err.message : String(err);
          element.innerHTML = `<div class="md-mermaid-error" style="padding: 1rem; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 0.5rem; color: #ef4444;">
						<strong>Failed to render diagram</strong>
						<pre style="margin-top: 0.5rem; font-size: 0.875rem; overflow-x: auto;">${escapeHtml(errorMsg)}</pre>
					</div>`;
        }
      }
    } catch (err) {
      console.error('Failed to load mermaid:', err);
      const diagrams = document.querySelectorAll('.md-mermaid[data-diagram]');
      if (diagrams.length > 0) {
        for (const element of diagrams) {
          element.innerHTML = `<div class="md-mermaid-error" style="padding: 1rem; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 0.5rem; color: #ef4444;">
						<strong>Mermaid library not available</strong>
						<p style="margin-top: 0.5rem;">The mermaid package needs to be installed. Run: <code>bun add mermaid</code></p>
					</div>`;
        }
      }
    }
  }

  function hydrate() {
    requestAnimationFrame(() => {
      void renderDiagrams();
    });
  }

  useHydrator(hydrate);
</script>

<!-- Fullscreen Modal -->
{#if modalOpen}
  <div
    class="md-mermaid-modal"
    onclick={(e) => e.target === e.currentTarget && closeModal()}
    onkeydown={handleKeydown}
    onwheel={handleWheel}
    role="dialog"
    aria-modal="true"
    class:dragging={isDragging}
  >
    <button class="md-mermaid-modal-close" onclick={closeModal} aria-label="Close diagram">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>

    <!-- Zoom Controls -->
    <div class="md-mermaid-zoom-controls">
      <button class="md-mermaid-zoom-btn" onclick={zoomIn} aria-label="Zoom in" title="Zoom in">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="11" y1="8" x2="11" y2="14"></line>
          <line x1="8" y1="11" x2="14" y2="11"></line>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </button>
      <button class="md-mermaid-zoom-btn" onclick={zoomOut} aria-label="Zoom out" title="Zoom out">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="8" y1="11" x2="14" y2="11"></line>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </button>
      <button
        class="md-mermaid-zoom-btn"
        onclick={resetZoom}
        aria-label="Reset zoom"
        title="Reset zoom and pan"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
          <path d="M21 3v5h-5"></path>
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
          <path d="M3 21v-5h5"></path>
        </svg>
      </button>
      <div class="md-mermaid-zoom-level">{Math.round(zoom * 100)}%</div>
    </div>

    <div
      class="md-mermaid-modal-content"
      onmousedown={handleMouseDown}
      onmousemove={handleMouseMove}
      onmouseup={handleMouseUp}
      onmouseleave={handleMouseUp}
    >
      <div
        class="md-mermaid-modal-diagram"
        style="transform: translate({panX}px, {panY}px) scale({zoom}); transform-origin: center;"
      >
        <!-- svelte-ignore svelte/no-at-html-tags -->
        {@html modalSvg}
      </div>
    </div>
  </div>
{/if}

<style>
  .md-mermaid-modal {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(0, 0, 0, 0.95);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .md-mermaid-modal-content {
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .md-mermaid-modal-diagram {
    /* Container that applies zoom/pan transform */
    /* Inline-block allows it to size to its SVG content */
    display: inline-block;
    max-width: 90vw;
    max-height: 85vh;
    /* Smooth transform for zoom/pan */
    transition: transform 0.1s ease-out;
    will-change: transform;
  }

  .md-mermaid-modal-diagram :global(svg) {
    /* Constrain SVG while preserving aspect ratio via viewBox */
    display: block;
    max-width: 100%;
    max-height: 100%;
    /* Scale up small diagrams to fill available space better */
    min-width: 600px;
    min-height: 400px;
    /* Mermaid's width/height attributes will be constrained by max-width/max-height */
    /* The viewBox attribute ensures proper aspect ratio scaling */
    pointer-events: none;
    user-select: none;
  }

  .md-mermaid-modal-close {
    position: fixed;
    top: 1.5rem;
    right: 1.5rem;
    width: 48px;
    height: 48px;
    border: none;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 50%;
    color: white;
    cursor: pointer !important;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    z-index: 10000;
  }

  .md-mermaid-modal-close:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
  }

  .md-mermaid-modal-close:focus {
    outline: 2px solid white;
    outline-offset: 4px;
  }

  .md-mermaid-modal-close svg {
    width: 24px;
    height: 24px;
  }

  .md-mermaid-modal {
    cursor: grab;
  }

  .md-mermaid-modal.dragging {
    cursor: grabbing;
  }

  /* Zoom Controls */
  .md-mermaid-zoom-controls {
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    z-index: 10000;
  }

  .md-mermaid-zoom-btn {
    width: 48px;
    height: 48px;
    border: none;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 50%;
    color: white;
    cursor: pointer !important;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .md-mermaid-zoom-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
  }

  .md-mermaid-zoom-btn:focus {
    outline: 2px solid white;
    outline-offset: 4px;
  }

  .md-mermaid-zoom-btn svg {
    width: 20px;
    height: 20px;
  }

  .md-mermaid-zoom-level {
    padding: 0.5rem 1rem;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 10px;
    color: white;
    font-size: 0.875rem;
    font-family: var(--v2-font-mono, ui-monospace, monospace);
    text-align: center;
    user-select: none;
  }
</style>
