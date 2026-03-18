<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Inibin Editor</title>
	<meta
		name="description"
		content="A browser-based editor for League of Legends .inibin files. Open, view, search, edit, and export inibin files."
	/>
	<meta name="keywords" content="inibin, editor, League of Legends, inibin editor, ini, modding" />
	<meta property="og:type" content="website" />
	<meta property="og:title" content="Inibin Editor" />
	<meta
		property="og:description"
		content="A browser-based editor for League of Legends .inibin files. Open, view, search, edit, and export inibin files."
	/>
	<meta property="og:image" content={favicon} />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content="Inibin Editor" />
	<meta
		name="twitter:description"
		content="A browser-based editor for League of Legends .inibin files. Open, view, search, edit, and export inibin files."
	/>
	<meta name="twitter:image" content={favicon} />
</svelte:head>
{@render children()}
