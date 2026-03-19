<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>LoLxbin Editor</title>
	<meta
		name="description"
		content="A browser-based editor for League of Legends .inibin, .ini, .troybin, and .troy files. Open, view, search, edit, and export these files."
	/>
	<meta name="keywords" content="inibin, ini, troybin, troy, editor, League of Legends, modding" />
	<meta property="og:type" content="website" />
	<meta property="og:title" content="LoLxbin Editor" />
	<meta
		property="og:description"
		content="A browser-based editor for League of Legends .inibin, .ini, .troybin, and .troy files. Open, view, search, edit, and export these files."
	/>
	<meta property="og:image" content={favicon} />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content="LoLxbin Editor" />
	<meta
		name="twitter:description"
		content="A browser-based editor for League of Legends .inibin, .ini, .troybin, and .troy files. Open, view, search, edit, and export these files."
	/>
	<meta name="twitter:image" content={favicon} />
</svelte:head>
{@render children()}
