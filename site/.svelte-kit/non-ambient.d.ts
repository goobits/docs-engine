
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	export interface AppTypes {
		RouteId(): "/" | "/docs" | "/docs/architecture" | "/docs/content" | "/docs/content/.generated" | "/docs/content/guides" | "/docs/content/plugins" | "/docs/getting-started" | "/docs/guides" | "/docs/guides/diagrams" | "/docs/guides/examples" | "/docs/guides/plugin-order" | "/docs/plugins" | "/docs/plugins/callouts" | "/docs/plugins/code-highlighting" | "/docs/plugins/code-tabs" | "/docs/plugins/collapse" | "/docs/plugins/filetree" | "/docs/plugins/frontmatter" | "/docs/plugins/image-optimization" | "/docs/plugins/katex" | "/docs/plugins/links" | "/docs/plugins/mermaid" | "/docs/plugins/navigation" | "/docs/plugins/screenshots" | "/docs/plugins/symbol-references" | "/docs/plugins/toc";
		RouteParams(): {
			
		};
		LayoutParams(): {
			"/": Record<string, never>;
			"/docs": Record<string, never>;
			"/docs/architecture": Record<string, never>;
			"/docs/content": Record<string, never>;
			"/docs/content/.generated": Record<string, never>;
			"/docs/content/guides": Record<string, never>;
			"/docs/content/plugins": Record<string, never>;
			"/docs/getting-started": Record<string, never>;
			"/docs/guides": Record<string, never>;
			"/docs/guides/diagrams": Record<string, never>;
			"/docs/guides/examples": Record<string, never>;
			"/docs/guides/plugin-order": Record<string, never>;
			"/docs/plugins": Record<string, never>;
			"/docs/plugins/callouts": Record<string, never>;
			"/docs/plugins/code-highlighting": Record<string, never>;
			"/docs/plugins/code-tabs": Record<string, never>;
			"/docs/plugins/collapse": Record<string, never>;
			"/docs/plugins/filetree": Record<string, never>;
			"/docs/plugins/frontmatter": Record<string, never>;
			"/docs/plugins/image-optimization": Record<string, never>;
			"/docs/plugins/katex": Record<string, never>;
			"/docs/plugins/links": Record<string, never>;
			"/docs/plugins/mermaid": Record<string, never>;
			"/docs/plugins/navigation": Record<string, never>;
			"/docs/plugins/screenshots": Record<string, never>;
			"/docs/plugins/symbol-references": Record<string, never>;
			"/docs/plugins/toc": Record<string, never>
		};
		Pathname(): "/" | "/docs" | "/docs/" | "/docs/architecture" | "/docs/architecture/" | "/docs/content" | "/docs/content/" | "/docs/content/.generated" | "/docs/content/.generated/" | "/docs/content/guides" | "/docs/content/guides/" | "/docs/content/plugins" | "/docs/content/plugins/" | "/docs/getting-started" | "/docs/getting-started/" | "/docs/guides" | "/docs/guides/" | "/docs/guides/diagrams" | "/docs/guides/diagrams/" | "/docs/guides/examples" | "/docs/guides/examples/" | "/docs/guides/plugin-order" | "/docs/guides/plugin-order/" | "/docs/plugins" | "/docs/plugins/" | "/docs/plugins/callouts" | "/docs/plugins/callouts/" | "/docs/plugins/code-highlighting" | "/docs/plugins/code-highlighting/" | "/docs/plugins/code-tabs" | "/docs/plugins/code-tabs/" | "/docs/plugins/collapse" | "/docs/plugins/collapse/" | "/docs/plugins/filetree" | "/docs/plugins/filetree/" | "/docs/plugins/frontmatter" | "/docs/plugins/frontmatter/" | "/docs/plugins/image-optimization" | "/docs/plugins/image-optimization/" | "/docs/plugins/katex" | "/docs/plugins/katex/" | "/docs/plugins/links" | "/docs/plugins/links/" | "/docs/plugins/mermaid" | "/docs/plugins/mermaid/" | "/docs/plugins/navigation" | "/docs/plugins/navigation/" | "/docs/plugins/screenshots" | "/docs/plugins/screenshots/" | "/docs/plugins/symbol-references" | "/docs/plugins/symbol-references/" | "/docs/plugins/toc" | "/docs/plugins/toc/";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): string & {};
	}
}