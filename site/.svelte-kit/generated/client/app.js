export { matchers } from './matchers.js';

export const nodes = [
	() => import('./nodes/0'),
	() => import('./nodes/1'),
	() => import('./nodes/2'),
	() => import('./nodes/3'),
	() => import('./nodes/4'),
	() => import('./nodes/5'),
	() => import('./nodes/6'),
	() => import('./nodes/7'),
	() => import('./nodes/8'),
	() => import('./nodes/9'),
	() => import('./nodes/10'),
	() => import('./nodes/11'),
	() => import('./nodes/12'),
	() => import('./nodes/13'),
	() => import('./nodes/14'),
	() => import('./nodes/15'),
	() => import('./nodes/16'),
	() => import('./nodes/17'),
	() => import('./nodes/18'),
	() => import('./nodes/19'),
	() => import('./nodes/20'),
	() => import('./nodes/21'),
	() => import('./nodes/22')
];

export const server_loads = [];

export const dictionary = {
		"/": [2],
		"/docs": [3],
		"/docs/architecture": [4],
		"/docs/getting-started": [5],
		"/docs/guides/diagrams": [6],
		"/docs/guides/examples": [7],
		"/docs/guides/plugin-order": [8],
		"/docs/plugins/callouts": [9],
		"/docs/plugins/code-highlighting": [10],
		"/docs/plugins/code-tabs": [11],
		"/docs/plugins/collapse": [12],
		"/docs/plugins/filetree": [13],
		"/docs/plugins/frontmatter": [14],
		"/docs/plugins/image-optimization": [15],
		"/docs/plugins/katex": [16],
		"/docs/plugins/links": [17],
		"/docs/plugins/mermaid": [18],
		"/docs/plugins/navigation": [19],
		"/docs/plugins/screenshots": [20],
		"/docs/plugins/symbol-references": [21],
		"/docs/plugins/toc": [22]
	};

export const hooks = {
	handleError: (({ error }) => { console.error(error) }),
	
	reroute: (() => {}),
	transport: {}
};

export const decoders = Object.fromEntries(Object.entries(hooks.transport).map(([k, v]) => [k, v.decode]));
export const encoders = Object.fromEntries(Object.entries(hooks.transport).map(([k, v]) => [k, v.encode]));

export const hash = false;

export const decode = (type, value) => decoders[type](value);

export { default as root } from '../root.js';