<script lang="ts">
  /**
   * OpenAPI Documentation Component
   *
   * Renders formatted API endpoint documentation with:
   * - Method badge and path
   * - Request/response schemas
   * - Interactive examples (cURL, TypeScript)
   * - Collapsible sections
   */

  import type { OpenAPIEndpoint } from '../utils/openapi-formatter';
  import {
    formatSchema,
    generateCurlExample,
    generateTypeScriptExample,
  } from '../utils/openapi-formatter';

  interface Props {
    endpoint: OpenAPIEndpoint;
    theme?: string;
    baseUrl?: string;
  }

  let { endpoint, theme = 'dracula', baseUrl = '/api' }: Props = $props();

  let activeExampleTab = $state<'curl' | 'typescript'>('curl');
  let expandedSections = $state<Record<string, boolean>>({
    request: false,
    responses: false,
  });

  // Generate examples
  const curlExample = generateCurlExample(endpoint, baseUrl);
  const tsExample = generateTypeScriptExample(endpoint);

  function toggleSection(section: string) {
    expandedSections[section] = !expandedSections[section];
  }

  function getMethodColor(method: string): string {
    switch (method) {
      case 'GET':
        return '#50fa7b';
      case 'POST':
        return '#8be9fd';
      case 'PUT':
        return '#f1fa8c';
      case 'DELETE':
        return '#ff5555';
      case 'PATCH':
        return '#ff79c6';
      default:
        return '#6272a4';
    }
  }

  function getStatusColor(status: string): string {
    const code = parseInt(status);
    if (code >= 200 && code < 300) return '#50fa7b';
    if (code >= 400 && code < 500) return '#f1fa8c';
    if (code >= 500) return '#ff5555';
    return '#6272a4';
  }
</script>

<div class="openapi-doc" data-theme={theme}>
  <!-- Header: Method + Path -->
  <div class="openapi-doc__header">
    <span class="openapi-doc__method" style="background-color: {getMethodColor(endpoint.method)};">
      {endpoint.method}
    </span>
    <code class="openapi-doc__path">{endpoint.path}</code>
  </div>

  <!-- Summary -->
  {#if endpoint.summary}
    <p class="openapi-doc__summary">{endpoint.summary}</p>
  {/if}

  <!-- Description -->
  {#if endpoint.description}
    <p class="openapi-doc__description">{endpoint.description}</p>
  {/if}

  <!-- Query/Path Parameters -->
  {#if endpoint.parameters && endpoint.parameters.length > 0}
    <div class="openapi-doc__section">
      <h4 class="openapi-doc__section-title">Parameters</h4>
      <div class="openapi-doc__params">
        {#each endpoint.parameters as param}
          <div class="openapi-doc__param">
            <div class="openapi-doc__param-header">
              <code class="openapi-doc__param-name">{param.name}</code>
              <span class="openapi-doc__param-in">{param.in}</span>
              {#if param.required}
                <span class="openapi-doc__param-required">required</span>
              {/if}
            </div>
            {#if param.description}
              <p class="openapi-doc__param-desc">{param.description}</p>
            {/if}
            <code class="openapi-doc__param-type">{formatSchema(param.schema)}</code>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Request Body -->
  {#if endpoint.requestBody}
    <div class="openapi-doc__section">
      <button
        class="openapi-doc__section-toggle"
        onclick={() => toggleSection('request')}
        aria-expanded={expandedSections.request}
      >
        <span class="openapi-doc__section-icon">
          {expandedSections.request ? '▼' : '▶'}
        </span>
        <h4 class="openapi-doc__section-title">
          Request Body
          {#if endpoint.requestBody.required}
            <span class="openapi-doc__required-badge">required</span>
          {/if}
        </h4>
      </button>

      {#if expandedSections.request}
        <div class="openapi-doc__schema">
          <pre><code>{formatSchema(endpoint.requestBody.schema)}</code></pre>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Responses -->
  <div class="openapi-doc__section">
    <button
      class="openapi-doc__section-toggle"
      onclick={() => toggleSection('responses')}
      aria-expanded={expandedSections.responses}
    >
      <span class="openapi-doc__section-icon">
        {expandedSections.responses ? '▼' : '▶'}
      </span>
      <h4 class="openapi-doc__section-title">Responses</h4>
    </button>

    {#if expandedSections.responses}
      <div class="openapi-doc__responses">
        {#each Object.entries(endpoint.responses) as [statusCode, response]}
          <details
            class="openapi-doc__response"
            open={statusCode === '200' || statusCode === '201'}
          >
            <summary class="openapi-doc__response-summary">
              <span
                class="openapi-doc__status-code"
                style="background-color: {getStatusColor(statusCode)};"
              >
                {statusCode}
              </span>
              <span class="openapi-doc__status-text">{response.description}</span>
            </summary>

            {#if response.schema}
              <div class="openapi-doc__schema">
                <pre><code>{formatSchema(response.schema)}</code></pre>
              </div>
            {/if}
          </details>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Examples -->
  <div class="openapi-doc__section">
    <h4 class="openapi-doc__section-title">Examples</h4>

    <div class="openapi-doc__examples">
      <div class="openapi-doc__example-tabs">
        <button
          class="openapi-doc__example-tab"
          class:openapi-doc__example-tab--active={activeExampleTab === 'curl'}
          onclick={() => (activeExampleTab = 'curl')}
        >
          cURL
        </button>
        <button
          class="openapi-doc__example-tab"
          class:openapi-doc__example-tab--active={activeExampleTab === 'typescript'}
          onclick={() => (activeExampleTab = 'typescript')}
        >
          TypeScript
        </button>
      </div>

      <div class="openapi-doc__example-content">
        {#if activeExampleTab === 'curl'}
          <pre class="language-bash"><code>{curlExample}</code></pre>
        {:else}
          <pre class="language-typescript"><code>{tsExample}</code></pre>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .openapi-doc {
    margin: 2rem 0;
    background: var(--md-surface-base, rgba(255, 255, 255, 0.03));
    border: 1px solid var(--md-border-medium, rgba(255, 255, 255, 0.1));
    border-radius: 14px;
    overflow: hidden;
  }

  .openapi-doc__header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    background: var(--md-surface-raised, rgba(255, 255, 255, 0.05));
    border-bottom: 1px solid var(--md-border-subtle, rgba(255, 255, 255, 0.06));
  }

  .openapi-doc__method {
    padding: 0.25rem 0.75rem;
    border-radius: 6px;
    color: #282a36;
    font-weight: 700;
    font-size: 0.875rem;
    font-family: var(--md-font-mono, monospace);
    letter-spacing: 0.5px;
  }

  .openapi-doc__path {
    flex: 1;
    font-size: 1rem;
    font-family: var(--md-font-mono, monospace);
    color: var(--md-text-primary, rgba(255, 255, 255, 0.95));
  }

  .openapi-doc__summary {
    padding: 1rem 1.5rem;
    margin: 0;
    font-size: 1rem;
    color: var(--md-text-primary, rgba(255, 255, 255, 0.95));
    border-bottom: 1px solid var(--md-border-subtle, rgba(255, 255, 255, 0.06));
  }

  .openapi-doc__description {
    padding: 1rem 1.5rem;
    margin: 0;
    font-size: 0.875rem;
    color: var(--md-text-secondary, rgba(255, 255, 255, 0.8));
    border-bottom: 1px solid var(--md-border-subtle, rgba(255, 255, 255, 0.06));
  }

  .openapi-doc__section {
    padding: 1.5rem;
    border-bottom: 1px solid var(--md-border-subtle, rgba(255, 255, 255, 0.06));
  }

  .openapi-doc__section:last-child {
    border-bottom: none;
  }

  .openapi-doc__section-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--md-text-primary, rgba(255, 255, 255, 0.95));
  }

  .openapi-doc__section-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    color: inherit;
  }

  .openapi-doc__section-icon {
    font-size: 0.75rem;
    color: var(--md-text-secondary, rgba(255, 255, 255, 0.7));
    transition: transform 0.2s;
  }

  .openapi-doc__required-badge {
    display: inline-block;
    padding: 0.125rem 0.5rem;
    margin-left: 0.5rem;
    background: rgba(255, 85, 85, 0.1);
    border: 1px solid rgba(255, 85, 85, 0.3);
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
    color: #ff5555;
  }

  .openapi-doc__params {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 1rem;
  }

  .openapi-doc__param {
    padding: 1rem;
    background: var(--md-surface-base, rgba(255, 255, 255, 0.03));
    border: 1px solid var(--md-border-subtle, rgba(255, 255, 255, 0.06));
    border-radius: 10px;
  }

  .openapi-doc__param-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .openapi-doc__param-name {
    font-family: var(--md-font-mono, monospace);
    font-size: 0.875rem;
    color: var(--md-text-primary, rgba(255, 255, 255, 0.95));
  }

  .openapi-doc__param-in {
    padding: 0.125rem 0.5rem;
    background: rgba(139, 233, 253, 0.1);
    border: 1px solid rgba(139, 233, 253, 0.3);
    border-radius: 4px;
    font-size: 0.75rem;
    color: #8be9fd;
  }

  .openapi-doc__param-required {
    padding: 0.125rem 0.5rem;
    background: rgba(255, 85, 85, 0.1);
    border: 1px solid rgba(255, 85, 85, 0.3);
    border-radius: 4px;
    font-size: 0.75rem;
    color: #ff5555;
  }

  .openapi-doc__param-desc {
    margin: 0 0 0.5rem 0;
    font-size: 0.875rem;
    color: var(--md-text-secondary, rgba(255, 255, 255, 0.8));
  }

  .openapi-doc__param-type {
    display: block;
    font-family: var(--md-font-mono, monospace);
    font-size: 0.75rem;
    color: var(--md-text-tertiary, rgba(255, 255, 255, 0.6));
  }

  .openapi-doc__schema {
    margin-top: 1rem;
    padding: 1rem;
    background: var(--md-surface-base, rgba(255, 255, 255, 0.03));
    border: 1px solid var(--md-border-subtle, rgba(255, 255, 255, 0.06));
    border-radius: 10px;
    overflow-x: auto;
  }

  .openapi-doc__schema pre {
    margin: 0;
    font-family: var(--md-font-mono, monospace);
    font-size: 0.875rem;
    color: var(--md-text-primary, rgba(255, 255, 255, 0.95));
    white-space: pre-wrap;
    word-break: break-word;
  }

  .openapi-doc__schema code {
    font-family: inherit;
  }

  .openapi-doc__responses {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-top: 1rem;
  }

  .openapi-doc__response {
    background: var(--md-surface-base, rgba(255, 255, 255, 0.03));
    border: 1px solid var(--md-border-subtle, rgba(255, 255, 255, 0.06));
    border-radius: 10px;
    overflow: hidden;
  }

  .openapi-doc__response-summary {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    cursor: pointer;
    list-style: none;
    user-select: none;
  }

  .openapi-doc__response-summary::-webkit-details-marker {
    display: none;
  }

  .openapi-doc__status-code {
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    color: #282a36;
    font-weight: 700;
    font-size: 0.875rem;
    font-family: var(--md-font-mono, monospace);
  }

  .openapi-doc__status-text {
    flex: 1;
    font-size: 0.875rem;
    color: var(--md-text-secondary, rgba(255, 255, 255, 0.8));
  }

  .openapi-doc__examples {
    margin-top: 1rem;
  }

  .openapi-doc__example-tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .openapi-doc__example-tab {
    padding: 0.5rem 1rem;
    background: var(--md-surface-base, rgba(255, 255, 255, 0.03));
    border: 1px solid var(--md-border-subtle, rgba(255, 255, 255, 0.1));
    border-radius: 6px;
    color: var(--md-text-secondary, rgba(255, 255, 255, 0.7));
    cursor: pointer;
    transition: all 0.15s;
    font-size: 0.875rem;
    font-family: var(
      --md-font-sans,
      -apple-system,
      BlinkMacSystemFont,
      'Segoe UI',
      Roboto,
      Oxygen,
      Ubuntu,
      Cantarell,
      sans-serif
    );
  }

  .openapi-doc__example-tab:hover {
    background: var(--md-surface-raised, rgba(255, 255, 255, 0.08));
    border-color: var(--md-border-medium, rgba(255, 255, 255, 0.2));
    color: var(--md-text-primary, rgba(255, 255, 255, 0.95));
  }

  .openapi-doc__example-tab--active {
    background: var(--md-surface-accent, rgba(139, 233, 253, 0.1));
    border-color: #8be9fd;
    color: var(--md-text-primary, rgba(255, 255, 255, 0.95));
  }

  .openapi-doc__example-content {
    background: var(--md-surface-base, rgba(255, 255, 255, 0.03));
    border: 1px solid var(--md-border-subtle, rgba(255, 255, 255, 0.06));
    border-radius: 10px;
    overflow: hidden;
  }

  .openapi-doc__example-content pre {
    margin: 0;
    padding: 1rem;
    font-family: var(--md-font-mono, monospace);
    font-size: 0.875rem;
    color: var(--md-text-primary, rgba(255, 255, 255, 0.95));
    overflow-x: auto;
  }

  .openapi-doc__example-content code {
    font-family: inherit;
  }

  /* Mobile responsive */
  @media (max-width: 640px) {
    .openapi-doc__header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .openapi-doc__path {
      width: 100%;
      overflow-x: auto;
    }

    .openapi-doc__param-header {
      flex-wrap: wrap;
    }
  }
</style>
