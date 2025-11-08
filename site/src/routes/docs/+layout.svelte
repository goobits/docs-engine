<script lang="ts">
  import { page } from '$app/stores';
  import { ThemeToggle } from '@goobits/themes/svelte';
  import type { LayoutData } from './$types';

  interface Props {
    data: LayoutData;
    children: any;
  }

  let { data, children }: Props = $props();

  // Mobile sidebar state
  let mobileMenuOpen = $state(false);

  function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
  }

  function closeMobileMenu() {
    mobileMenuOpen = false;
  }
</script>

<div class="docs-layout">
  <!-- Mobile Menu Toggle -->
  <button
    class="docs-mobile-toggle"
    onclick={toggleMobileMenu}
    type="button"
    aria-label="Toggle menu"
  >
    {#if mobileMenuOpen}
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    {:else}
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    {/if}
  </button>

  <!-- Theme Toggle -->
  <div class="docs-theme-toggle">
    <ThemeToggle />
  </div>

  <!-- Sidebar -->
  <nav class="docs-sidebar {mobileMenuOpen ? 'mobile-open' : ''}">
    <div class="docs-sidebar-content">
      <h2 class="docs-sidebar-title">Documentation</h2>
      {#each data.navigation as section}
        <div class="docs-sidebar-section">
          <h3 class="docs-sidebar-section-title">{section.title}</h3>
          <ul class="docs-sidebar-links">
            {#each section.links as link}
              <li>
                <a
                  href={link.href}
                  class="docs-sidebar-link"
                  class:active={$page.url.pathname === link.href}
                >
                  {link.title}
                </a>
              </li>
            {/each}
          </ul>
        </div>
      {/each}
    </div>
  </nav>

  <!-- Overlay for mobile -->
  {#if mobileMenuOpen}
    <button class="docs-overlay" onclick={closeMobileMenu} type="button" aria-label="Close menu"
    ></button>
  {/if}

  <!-- Main Content Area -->
  <div class="docs-main">
    {@render children()}
  </div>
</div>

<style>
  .docs-layout {
    display: flex;
    min-height: 100vh;
    position: relative;
  }

  .docs-mobile-toggle {
    position: fixed;
    top: 1rem;
    left: 1rem;
    z-index: 1001;
    display: none;
    padding: 0.5rem;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .docs-mobile-toggle:hover {
    background: #f9fafb;
  }

  .docs-theme-toggle {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 1001;
  }

  .docs-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    width: 280px;
    height: 100vh;
    overflow-y: auto;
    background: white;
    border-right: 1px solid #e5e7eb;
    transition: transform 0.3s ease;
  }

  .docs-sidebar-content {
    padding: 2rem 1.5rem;
  }

  .docs-sidebar-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0 0 1.5rem 0;
    color: #111827;
  }

  .docs-sidebar-section {
    margin-bottom: 1.5rem;
  }

  .docs-sidebar-section-title {
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #6b7280;
    margin: 0 0 0.75rem 0;
  }

  .docs-sidebar-links {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .docs-sidebar-links li {
    margin: 0;
  }

  .docs-sidebar-link {
    display: block;
    padding: 0.5rem 0.75rem;
    color: #374151;
    text-decoration: none;
    border-radius: 0.375rem;
    transition: all 0.15s;
    font-size: 0.9375rem;
  }

  .docs-sidebar-link:hover {
    background: #f3f4f6;
    color: #111827;
  }

  .docs-sidebar-link.active {
    background: #eff6ff;
    color: #2563eb;
    font-weight: 500;
  }

  .docs-main {
    flex: 1;
    margin-left: 280px;
    width: 100%;
  }

  .docs-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
  }

  /* Mobile Styles */
  @media (max-width: 768px) {
    .docs-mobile-toggle {
      display: block;
    }

    .docs-sidebar {
      transform: translateX(-100%);
      z-index: 1000;
    }

    .docs-sidebar.mobile-open {
      transform: translateX(0);
    }

    .docs-main {
      margin-left: 0;
    }

    .docs-overlay {
      display: block;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s;
    }

    .docs-sidebar.mobile-open ~ .docs-overlay {
      opacity: 1;
      pointer-events: auto;
    }
  }
</style>
