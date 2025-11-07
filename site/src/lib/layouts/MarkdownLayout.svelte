<script>
  export let title = 'Docs'
</script>

<div class="markdown-layout">
  <aside class="sidebar">
    <h2>Docs Engine</h2>
    <nav>
      <a href="/docs">Home</a>
      <a href="/docs/getting-started">Getting Started</a>
      <a href="/docs/architecture">Architecture</a>
    </nav>
  </aside>

  <main class="content">
    <article class="prose">
      <slot />
    </article>
  </main>
</div>

<style>
  .markdown-layout {
    display: flex;
    width: 100%;
    min-height: 100vh;
  }

  .sidebar {
    width: var(--sidebar-width);
    background: #f8f9fa;
    padding: 2rem 1.5rem;
    border-right: 1px solid #e1e4e8;
    position: sticky;
    top: 0;
    height: 100vh;
    overflow-y: auto;
  }

  .sidebar h2 {
    color: var(--color-primary);
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
  }

  .sidebar nav {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .sidebar a {
    color: var(--color-secondary);
    text-decoration: none;
    padding: 0.5rem 0.75rem;
    border-radius: 0.25rem;
    transition: all 0.2s;
  }

  .sidebar a:hover {
    background: #e1e4e8;
    color: var(--color-primary);
  }

  .content {
    flex: 1;
    padding: 3rem;
    max-width: 900px;
  }

  .prose :global(h1) {
    color: var(--color-primary);
    border-bottom: 2px solid var(--color-primary);
    padding-bottom: 0.5rem;
    margin-bottom: 1.5rem;
  }

  .prose :global(h2) {
    color: var(--color-secondary);
    margin-top: 2.5rem;
    margin-bottom: 1rem;
  }

  .prose :global(h3) {
    color: var(--color-secondary);
    margin-top: 2rem;
    margin-bottom: 0.75rem;
  }

  .prose :global(pre) {
    background: var(--color-code-bg);
    padding: 1.5rem;
    border-radius: 0.5rem;
    overflow-x: auto;
    margin: 1.5rem 0;
  }

  .prose :global(code) {
    font-family: 'Fira Code', 'Courier New', monospace;
    font-size: 0.9em;
  }

  .prose :global(p) {
    margin-bottom: 1rem;
    line-height: 1.7;
  }

  .prose :global(ul), .prose :global(ol) {
    margin-left: 1.5rem;
    margin-bottom: 1rem;
  }

  .prose :global(li) {
    margin-bottom: 0.5rem;
  }

  .prose :global(a) {
    color: var(--color-primary);
    text-decoration: none;
  }

  .prose :global(a:hover) {
    text-decoration: underline;
  }

  .prose :global(strong) {
    font-weight: 600;
    color: #000;
  }

  .prose :global(blockquote) {
    border-left: 4px solid var(--color-primary);
    padding-left: 1rem;
    margin: 1.5rem 0;
    color: var(--color-secondary);
  }
</style>
