<script>
  import '../app.css';
  import '@goobits/themes/themes/default.css';
  import '@goobits/themes/themes/spells.css';
  import { ThemeProvider } from '@goobits/themes/svelte';
  import { themeConfig } from '$lib/config/theme';

  const { data } = $props();
</script>

<ThemeProvider config={themeConfig} serverPreferences={data.preferences}>
  <div class="app">
    <slot />
  </div>
</ThemeProvider>
