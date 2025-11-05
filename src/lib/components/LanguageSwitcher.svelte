<script lang="ts">
	import type { I18nConfig } from '../config/index.js';
	import { getLocalizedPath, stripLocaleFromPath } from '../utils/i18n.js';

	/**
	 * i18n configuration
	 */
	export let i18nConfig: I18nConfig | undefined = undefined;

	/**
	 * Current locale code
	 */
	export let currentLocale: string = 'en';

	/**
	 * Current pathname (used to build locale-specific links)
	 */
	export let pathname: string = '/';

	/**
	 * Available locales for current page (optional)
	 * If not provided, shows all configured locales
	 */
	export let availableLocales: string[] | undefined = undefined;

	// Don't render if i18n not enabled or only one locale
	$: shouldRender = i18nConfig && i18nConfig.locales.length > 1;

	// Filter locales to show
	$: displayLocales = shouldRender
		? i18nConfig!.locales.filter((locale) =>
				availableLocales ? availableLocales.includes(locale.code) : true
		  )
		: [];

	// Strip current locale from pathname to get base path
	$: basePath = i18nConfig ? stripLocaleFromPath(pathname, i18nConfig) : pathname;

	/**
	 * Build locale-specific URL
	 */
	function getLocaleUrl(localeCode: string): string {
		if (!i18nConfig) return basePath;
		return getLocalizedPath(basePath, localeCode, i18nConfig);
	}

	/**
	 * Check if locale is current
	 */
	function isCurrent(localeCode: string): boolean {
		return localeCode === currentLocale;
	}
</script>

{#if shouldRender}
	<div class="language-switcher">
		<span class="language-switcher__label">Language:</span>
		<ul class="language-switcher__list">
			{#each displayLocales as locale (locale.code)}
				<li class="language-switcher__item">
					{#if isCurrent(locale.code)}
						<span class="language-switcher__link language-switcher__link--current">
							{locale.label}
						</span>
					{:else}
						<a href={getLocaleUrl(locale.code)} class="language-switcher__link">
							{locale.label}
						</a>
					{/if}
				</li>
			{/each}
		</ul>
	</div>
{/if}

<style>
	.language-switcher {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem;
		font-size: 0.875rem;
	}

	.language-switcher__label {
		color: var(--text-secondary, #6b7280);
		font-weight: 500;
	}

	.language-switcher__list {
		display: flex;
		gap: 0.5rem;
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.language-switcher__item {
		margin: 0;
	}

	.language-switcher__link {
		color: var(--text-primary, #111827);
		text-decoration: none;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		transition: background-color 0.2s;
	}

	.language-switcher__link:hover {
		background-color: var(--hover-bg, #f3f4f6);
	}

	.language-switcher__link--current {
		font-weight: 600;
		color: var(--primary-color, #3b82f6);
		cursor: default;
	}

	/* Dark mode support */
	@media (prefers-color-scheme: dark) {
		.language-switcher__label {
			color: var(--text-secondary-dark, #9ca3af);
		}

		.language-switcher__link {
			color: var(--text-primary-dark, #f9fafb);
		}

		.language-switcher__link:hover {
			background-color: var(--hover-bg-dark, #374151);
		}

		.language-switcher__link--current {
			color: var(--primary-color-dark, #60a5fa);
		}
	}
</style>
