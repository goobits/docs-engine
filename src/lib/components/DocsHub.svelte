<script lang="ts">
  /**
   * DocsHub Component
   *
   * Documentation hub page with section cards
   * Extracted from Spacebase for @goobits/markdown-docs
   */

  import Surface from './Surface.svelte';
  import Content from './Content.svelte';
  import { Terminal, Code, ExternalLink } from "@lucide/svelte";
  import type { DocsSection } from './types.js';

  interface Props {
    navigation: DocsSection[];
    title?: string;
    description?: string;
    githubUrl?: string;
  }

  let {
    navigation,
    title = "Documentation",
    description = "Everything you need to know",
    githubUrl
  }: Props = $props();
</script>

<div class="v2-docs">
  <!-- Header -->
  <div class="v2-docs__header">
    <Content variant="title">{title}</Content>
    <Content variant="body" color="secondary">
      {description}
    </Content>
  </div>

  <!-- Sections -->
  <div class="v2-docs__sections">
    {#each navigation as section (section.title)}
      <Surface variant="raised" radius="lg" padding="lg">
        <div class="v2-docs__section">
          <div class="v2-docs__section-header">
            <div class="v2-docs__section-icon">
              <svelte:component this={section.icon} size={20} />
            </div>
            <div class="v2-docs__section-title-wrapper">
              <Content variant="subtitle" weight="semibold">
                {section.title}
              </Content>
              <Content variant="caption" color="secondary">
                {section.description}
              </Content>
            </div>
          </div>

          <ul class="v2-docs__links">
            {#each section.links as link (link.href)}
              <li>
                <a href={link.href} class="v2-docs__link">
                  <div class="v2-docs__link-content">
                    <Content variant="body" weight="medium">
                      {link.title}
                    </Content>
                    <Content variant="caption" color="secondary">
                      {link.description}
                    </Content>
                  </div>
                  <ExternalLink size={16} class="v2-docs__link-icon" />
                </a>
              </li>
            {/each}
          </ul>
        </div>
      </Surface>
    {/each}
  </div>

  <!-- Help CTA -->
  {#if githubUrl}
    <div class="v2-docs__help">
      <Surface variant="raised" radius="lg" padding="lg">
        <div class="v2-docs__help-content">
          <div class="v2-docs__help-header">
            <Content variant="subtitle" weight="semibold">Need Help?</Content>
            <Content variant="body" color="secondary">
              Can't find what you're looking for? We're here to help.
            </Content>
          </div>
          <div class="v2-docs__help-actions">
            <a href="{githubUrl}/issues" class="v2-docs__help-button">
              <Terminal size={18} />
              Open an Issue
            </a>
            <a href={githubUrl} class="v2-docs__help-button">
              <Code size={18} />
              View on GitHub
            </a>
          </div>
        </div>
      </Surface>
    </div>
  {/if}
</div>

<style lang="scss">
  .v2-docs {
    display: flex;
    flex-direction: column;
    gap: var(--v2-spacing-2xl, 3rem);
  }

  .v2-docs__header {
    display: flex;
    flex-direction: column;
    gap: var(--v2-spacing-md, 1rem);
    animation: v2-reveal var(--v2-duration-normal, 300ms) var(--v2-ease-out, cubic-bezier(0.33, 1, 0.68, 1));

    /* Dracula gradient on title */
    :global(.md-content--title) {
      background: linear-gradient(135deg, #ff79c6 0%, #bd93f9 50%, #8be9fd 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  }

  @keyframes v2-reveal {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .v2-docs__sections {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: var(--v2-spacing-xl, 2rem);
    animation: v2-reveal var(--v2-duration-normal, 300ms) var(--v2-ease-out, cubic-bezier(0.33, 1, 0.68, 1)) 0.1s backwards;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }

  .v2-docs__section {
    display: flex;
    flex-direction: column;
    gap: var(--v2-spacing-lg, 1.5rem);
  }

  .v2-docs__section-header {
    display: flex;
    align-items: flex-start;
    gap: var(--v2-spacing-md, 1rem);
  }

  .v2-docs__section-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: var(--v2-surface-base, rgba(255, 255, 255, 0.03));
    border: 1px solid var(--v2-border-medium, rgba(255, 255, 255, 0.12));
    border-radius: var(--v2-radius-md, 10px);
    color: var(--v2-text-accent, rgb(0, 122, 255));
    flex-shrink: 0;
    transition: all var(--v2-duration-fast, 200ms) var(--v2-ease-out, cubic-bezier(0.33, 1, 0.68, 1));
  }

  .v2-docs__section:hover .v2-docs__section-icon {
    background: var(--v2-surface-interactive-hover, rgba(255, 255, 255, 0.08));
    border-color: var(--v2-text-accent, rgb(0, 122, 255));
    transform: scale(1.05);
  }

  .v2-docs__section-title-wrapper {
    display: flex;
    flex-direction: column;
    gap: var(--v2-spacing-xs, 0.25rem);
    flex: 1;
  }

  .v2-docs__links {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
  }

  .v2-docs__links li {
    border-bottom: 1px solid var(--v2-border-subtle, rgba(255, 255, 255, 0.06));
  }

  .v2-docs__links li:last-child {
    border-bottom: none;
  }

  .v2-docs__link {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--v2-spacing-md, 1rem);
    padding: var(--v2-spacing-lg, 1.5rem) 0;
    text-decoration: none;
    color: var(--v2-text-primary, rgba(255, 255, 255, 0.95));
    transition: all var(--v2-duration-fast, 200ms) var(--v2-ease-out, cubic-bezier(0.33, 1, 0.68, 1));
    outline: none;

    &:hover {
      color: var(--v2-text-accent, rgb(0, 122, 255));
      transform: translateX(var(--v2-spacing-xs, 0.25rem));

      .v2-docs__link-icon {
        opacity: 1;
        transform: translateX(var(--v2-spacing-xs, 0.25rem));
      }
    }

    &:focus-visible {
      box-shadow: 0 0 0 3px var(--v2-border-focus, rgba(0, 122, 255, 0.5));
    }
  }

  .v2-docs__link-content {
    display: flex;
    flex-direction: column;
    gap: var(--v2-spacing-xs, 0.25rem);
    flex: 1;
  }

  .v2-docs__link-icon {
    color: var(--v2-text-tertiary, rgba(255, 255, 255, 0.5));
    opacity: 0.5;
    transition: all var(--v2-duration-fast, 200ms) var(--v2-ease-out, cubic-bezier(0.33, 1, 0.68, 1));
    flex-shrink: 0;
  }

  .v2-docs__help {
    margin-top: var(--v2-spacing-xl, 2rem);
    animation: v2-reveal var(--v2-duration-normal, 300ms) var(--v2-ease-out, cubic-bezier(0.33, 1, 0.68, 1)) 0.2s backwards;
  }

  .v2-docs__help-content {
    display: flex;
    flex-direction: column;
    gap: var(--v2-spacing-xl, 2rem);
  }

  .v2-docs__help-header {
    display: flex;
    flex-direction: column;
    gap: var(--v2-spacing-sm, 0.5rem);
  }

  .v2-docs__help-actions {
    display: flex;
    gap: var(--v2-spacing-md, 1rem);
    flex-wrap: wrap;
  }

  .v2-docs__help-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--v2-spacing-sm, 0.5rem);
    padding: var(--v2-spacing-md, 1rem) var(--v2-spacing-lg, 1.5rem);
    font-size: var(--v2-font-size-base, 1rem);
    font-weight: 500;
    color: var(--v2-text-primary, rgba(255, 255, 255, 0.95));
    background: var(--v2-surface-base, rgba(255, 255, 255, 0.03));
    border: 1px solid var(--v2-border-medium, rgba(255, 255, 255, 0.12));
    border-radius: var(--v2-radius-full, 9999px);
    text-decoration: none;
    cursor: pointer;
    transition: all var(--v2-duration-fast, 200ms) var(--v2-ease-out, cubic-bezier(0.33, 1, 0.68, 1));
    outline: none;
    min-height: 44px;
    min-width: 44px;

    &:hover {
      background: var(--v2-surface-interactive-hover, rgba(255, 255, 255, 0.08));
      border-color: var(--v2-text-accent, rgb(0, 122, 255));
      transform: translateY(-2px);
      box-shadow: var(--v2-shadow-md, 0 4px 8px rgba(0, 0, 0, 0.3));
    }

    &:active {
      transform: translateY(0);
    }

    &:focus-visible {
      box-shadow: 0 0 0 3px var(--v2-border-focus, rgba(0, 122, 255, 0.5));
    }
  }
</style>
