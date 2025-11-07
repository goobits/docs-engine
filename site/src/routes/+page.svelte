<script>
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'

  onMount(() => {
    goto('/docs')
  })
</script>

<div style="padding: 2rem; text-align: center;">
  <h1>Docs Engine</h1>
  <p>Redirecting to docs...</p>
</div>
