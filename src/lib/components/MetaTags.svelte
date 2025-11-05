<script lang="ts">
	/**
	 * Meta Tags Component
	 *
	 * Generates SEO-optimized meta tags including Open Graph and Twitter Cards.
	 * Automatically handles titles, descriptions, images, and canonical URLs.
	 */

	interface Props {
		/** Page title */
		title: string;
		/** Page description */
		description?: string;
		/** Site name (for Open Graph) */
		siteName?: string;
		/** Canonical URL */
		url?: string;
		/** Open Graph image URL */
		image?: string;
		/** Image alt text */
		imageAlt?: string;
		/** Page type (default: "website") */
		type?: 'website' | 'article';
		/** Twitter handle (e.g., "@username") */
		twitterHandle?: string;
		/** Article publish date (ISO string) */
		publishedTime?: string;
		/** Article modified date (ISO string) */
		modifiedTime?: string;
		/** Article author */
		author?: string;
	}

	let {
		title,
		description,
		siteName,
		url,
		image,
		imageAlt,
		type = 'website',
		twitterHandle,
		publishedTime,
		modifiedTime,
		author
	}: Props = $props();

	// Build full title
	const fullTitle = $derived(siteName ? `${title} | ${siteName}` : title);
</script>

<svelte:head>
	<!-- Basic Meta Tags -->
	<title>{fullTitle}</title>
	{#if description}
		<meta name="description" content={description} />
	{/if}
	{#if author}
		<meta name="author" content={author} />
	{/if}

	<!-- Canonical URL -->
	{#if url}
		<link rel="canonical" href={url} />
	{/if}

	<!-- Open Graph -->
	<meta property="og:title" content={title} />
	{#if description}
		<meta property="og:description" content={description} />
	{/if}
	{#if url}
		<meta property="og:url" content={url} />
	{/if}
	<meta property="og:type" content={type} />
	{#if siteName}
		<meta property="og:site_name" content={siteName} />
	{/if}
	{#if image}
		<meta property="og:image" content={image} />
		{#if imageAlt}
			<meta property="og:image:alt" content={imageAlt} />
		{/if}
		<meta property="og:image:width" content="1200" />
		<meta property="og:image:height" content="630" />
	{/if}
	{#if publishedTime}
		<meta property="article:published_time" content={publishedTime} />
	{/if}
	{#if modifiedTime}
		<meta property="article:modified_time" content={modifiedTime} />
	{/if}
	{#if author}
		<meta property="article:author" content={author} />
	{/if}

	<!-- Twitter Card -->
	<meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
	<meta name="twitter:title" content={title} />
	{#if description}
		<meta name="twitter:description" content={description} />
	{/if}
	{#if image}
		<meta name="twitter:image" content={image} />
		{#if imageAlt}
			<meta name="twitter:image:alt" content={imageAlt} />
		{/if}
	{/if}
	{#if twitterHandle}
		<meta name="twitter:site" content={twitterHandle} />
		<meta name="twitter:creator" content={twitterHandle} />
	{/if}
</svelte:head>
