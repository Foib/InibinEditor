<script lang="ts">
	import { read } from '$lib/inibin2';
	import { fix } from '$lib/inibin_fix';
	import { writeIni, writeInibin } from '$lib/convert';
	import type { InibinData, InibinValue } from '$lib/types';
	import { Upload } from '@lucide/svelte';
	import favicon from '$lib/assets/favicon.svg';

	// --- State ---
	let data: InibinData | null = $state(null);
	let fileName: string = $state('');
	let error: string = $state('');
	let dragging: boolean = $state(false);
	let searchQuery: string = $state('');
	let collapsedSections: Set<string> = $state(new Set());

	// Track which sections are "unknown" vs resolved
	let activeTab: 'values' | 'unknown' = $state('values');

	// --- New entry form state ---
	let newSectionName: string = $state('');
	let newEntrySection: string = $state('');
	let newEntryName: string = $state('');
	let newEntryValue: string = $state('');

	// --- Derived ---
	let sections = $derived.by(() => {
		if (!data) return [] as string[];
		return Object.keys(data.Values).sort();
	});
	let unknownKeys = $derived.by(() => {
		if (!data) return [] as number[];
		return Object.keys(data.UNKNOWN_HASHES)
			.map(Number)
			.sort((a, b) => a - b);
	});
	let filteredSections = $derived.by(() => {
		if (!searchQuery) return sections;
		const q = searchQuery.toLowerCase();
		return sections.filter(
			(s) =>
				s.toLowerCase().includes(q) ||
				(data && Object.keys(data.Values[s]).some((k) => k.toLowerCase().includes(q)))
		);
	});
	let totalEntries = $derived.by(() => {
		if (!data) return 0;
		let count = 0;
		for (const section of Object.values(data.Values)) {
			count += Object.keys(section).length;
		}
		count += Object.keys(data.UNKNOWN_HASHES).length;
		return count;
	});

	// --- File loading ---
	async function loadFile(file: File) {
		error = '';
		try {
			const buffer = await file.arrayBuffer();
			const ibin = read(buffer);
			fix(ibin);
			data = ibin;
			fileName = file.name;
			collapsedSections = new Set();
			searchQuery = '';
			activeTab = 'values';
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
			data = null;
		}
	}

	function onFileInput(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) loadFile(file);
		input.value = '';
	}

	function onDrop(e: DragEvent) {
		e.preventDefault();
		dragging = false;
		const file = e.dataTransfer?.files?.[0];
		if (file) loadFile(file);
	}

	function onDragOver(e: DragEvent) {
		e.preventDefault();
		dragging = true;
	}

	function onDragLeave() {
		dragging = false;
	}

	// --- Section collapse ---
	function toggleSection(section: string) {
		const next = new Set(collapsedSections);
		if (next.has(section)) {
			next.delete(section);
		} else {
			next.add(section);
		}
		collapsedSections = next;
	}

	function collapseAll() {
		collapsedSections = new Set(sections);
	}

	function expandAll() {
		collapsedSections = new Set();
	}

	// --- Value editing ---
	function updateValue(section: string, name: string, rawValue: string) {
		if (!data) return;
		const parsed = parseInputValue(rawValue);
		data.Values[section][name] = parsed;
	}

	function updateUnknownValue(hash: number, rawValue: string) {
		if (!data) return;
		const parsed = parseInputValue(rawValue);
		data.UNKNOWN_HASHES[hash] = parsed;
	}

	function parseInputValue(raw: string): InibinValue {
		const trimmed = raw.trim();
		// Try number
		if (/^[-+]?\d+$/.test(trimmed)) return parseInt(trimmed, 10);
		if (/^[-+]?(\d+\.?\d*|\d*\.?\d+)(e[-+]?\d+)?$/i.test(trimmed)) return parseFloat(trimmed);
		// Try number array (space-separated)
		if (/^[-+]?\d[\d.e+-]*(\s+[-+]?\d[\d.e+-]*)+$/i.test(trimmed)) {
			return trimmed.split(/\s+/).map(Number);
		}
		// String (strip quotes if wrapped)
		if (
			(trimmed.startsWith('"') && trimmed.endsWith('"')) ||
			(trimmed.startsWith("'") && trimmed.endsWith("'"))
		) {
			return trimmed.slice(1, -1);
		}
		return trimmed;
	}

	function formatDisplay(value: InibinValue): string {
		if (typeof value === 'string') return JSON.stringify(value);
		if (Array.isArray(value)) return value.join(' ');
		return String(value);
	}

	// --- Add / Remove ---
	function addSection() {
		if (!data || !newSectionName.trim()) return;
		const name = newSectionName.trim();
		if (data.Values[name]) {
			error = `Section "${name}" already exists`;
			return;
		}
		data.Values[name] = {};
		newSectionName = '';
		error = '';
	}

	function removeSection(section: string) {
		if (!data) return;
		delete data.Values[section];
		// Trigger reactivity
		data = { ...data, Values: { ...data.Values } };
	}

	function addEntry() {
		if (!data || !newEntrySection || !newEntryName.trim()) return;
		const section = newEntrySection;
		const name = newEntryName.trim();
		if (!data.Values[section]) {
			data.Values[section] = {};
		}
		data.Values[section][name] = parseInputValue(newEntryValue || '0');
		newEntryName = '';
		newEntryValue = '';
		error = '';
	}

	function removeEntry(section: string, name: string) {
		if (!data) return;
		delete data.Values[section][name];
		data = { ...data, Values: { ...data.Values, [section]: { ...data.Values[section] } } };
	}

	function removeUnknownEntry(hash: number) {
		if (!data) return;
		delete data.UNKNOWN_HASHES[hash];
		data = { ...data, UNKNOWN_HASHES: { ...data.UNKNOWN_HASHES } };
	}

	// --- Save / Export ---
	function saveAsIni() {
		if (!data) return;
		const text = writeIni(data);
		download(text, fileName.replace(/\.inibin$/i, '') + '.ini', 'text/plain');
	}

	function saveAsInibin() {
		if (!data) return;
		const buffer = writeInibin(data);
		download(buffer, fileName || 'output.inibin', 'application/octet-stream');
	}

	function download(content: string | ArrayBuffer, name: string, mime: string) {
		const blob =
			content instanceof ArrayBuffer
				? new Blob([content], { type: mime })
				: new Blob([content], { type: mime });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = name;
		a.click();
		URL.revokeObjectURL(url);
	}

	function formatHash(hash: number): string {
		return `unk${hash.toString(16).toUpperCase().padStart(8, '0')}`;
	}
</script>

<svelte:head>
	<title>{fileName ? `${fileName} - Inibin Editor` : 'Inibin Editor'}</title>
</svelte:head>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="flex h-screen flex-col overflow-hidden bg-neutral-950 text-neutral-200"
	ondrop={onDrop}
	ondragover={onDragOver}
	ondragleave={onDragLeave}
>
	<!-- Header -->
	<header class="flex items-center justify-between border-b border-neutral-800 px-6 py-2">
		<div class="flex items-center gap-4">
			<img src={favicon} alt="" class="h-12 w-12" />
			<h1 class="text-xl font-bold text-white">Inibin Editor</h1>
			{#if data}
				<span class="rounded bg-neutral-800 px-2 py-0.5 text-sm text-neutral-400">
					{fileName}
				</span>
				<span class="text-sm text-neutral-500">
					{sections.length} sections, {totalEntries} entries
				</span>
			{/if}
		</div>
		<div class="flex items-center gap-3">
			{#if data}
				<button
					onclick={saveAsIni}
					class="cursor-pointer rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
				>
					Export .ini
				</button>
				<button
					onclick={saveAsInibin}
					class="cursor-pointer rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
				>
					Save .inibin
				</button>
				<label
					class="cursor-pointer rounded bg-neutral-700 px-3 py-1.5 text-sm font-medium text-neutral-200 transition-colors hover:bg-neutral-600"
				>
					Open File
					<input type="file" accept=".inibin" class="hidden" onchange={onFileInput} />
				</label>
			{/if}
		</div>
	</header>

	<!-- Error banner -->
	{#if error}
		<div class="border-b border-red-800 bg-red-950 px-6 py-2 text-sm text-red-300">
			{error}
			<button onclick={() => (error = '')} class="ml-2 text-red-400 underline">dismiss</button>
		</div>
	{/if}

	<!-- Main content -->
	{#if !data}
		<!-- Drop zone / welcome screen -->
		<div class="flex flex-1 items-center justify-center p-8">
			<div
				class="flex max-w-md flex-col items-center rounded-xl border-2 border-dashed p-12 text-center transition-all duration-500 {dragging
					? 'scale-110 border-blue-400 bg-blue-950/30'
					: 'scale-100 border-neutral-700 bg-neutral-900/50'}"
			>
				<Upload class="mb-4 h-12 w-12 text-neutral-600" />
				<p class="mb-2 text-lg font-medium text-neutral-300">Drop an .inibin file here</p>
				<p class="mb-4 text-sm text-neutral-500">or click the button below</p>
				<label
					class="cursor-pointer rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
				>
					Choose File
					<input type="file" accept=".inibin" class="hidden" onchange={onFileInput} />
				</label>
			</div>
		</div>
	{:else}
		<!-- Toolbar -->
		<div class="flex items-center gap-3 border-b border-neutral-800 px-6 py-3">
			<!-- Search -->
			<input
				type="text"
				placeholder="Search sections or keys..."
				bind:value={searchQuery}
				class="rounded border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm text-neutral-200 placeholder-neutral-500 outline-none focus:border-blue-500"
			/>

			<!-- Collapse/Expand -->
			<button
				onclick={collapseAll}
				class="cursor-pointer rounded bg-neutral-800 px-2 py-1 text-xs text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-neutral-200"
			>
				Collapse all
			</button>
			<button
				onclick={expandAll}
				class="cursor-pointer rounded bg-neutral-800 px-2 py-1 text-xs text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-neutral-200"
			>
				Expand all
			</button>

			<div class="flex-1"></div>

			<!-- Tabs -->
			<div class="flex items-center gap-2">
				<span class="text-xs text-neutral-500">Tab:</span>
				<button
					onclick={() => (activeTab = 'values')}
					class="cursor-pointer rounded px-2 py-1 text-xs transition-colors {activeTab === 'values'
						? 'bg-white text-black'
						: 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'}"
				>
					Values ({sections.length})
				</button>
				<button
					disabled={unknownKeys.length === 0}
					onclick={() => {
						if (unknownKeys.length > 0) activeTab = 'unknown';
					}}
					class="cursor-pointer rounded px-2 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50 {activeTab ===
					'unknown'
						? 'bg-white text-black'
						: 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'}"
				>
					Unknown ({unknownKeys.length})
				</button>
			</div>
		</div>

		<!-- Add section / entry controls -->
		<div
			class="flex flex-wrap items-center gap-3 border-b border-neutral-800 bg-neutral-900/50 px-6 py-2"
		>
			<!-- Add section -->
			<div class="flex items-center gap-2">
				<span class="text-xs text-neutral-500">Add section:</span>
				<input
					type="text"
					bind:value={newSectionName}
					placeholder="SectionName"
					class="w-36 rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs text-neutral-200 outline-none focus:border-blue-500"
					onkeydown={(e) => {
						if (e.key === 'Enter') addSection();
					}}
				/>
				<button
					onclick={addSection}
					class="cursor-pointer rounded bg-neutral-700 px-2 py-1 text-xs text-neutral-300 transition-colors hover:bg-neutral-600"
				>
					+
				</button>
			</div>

			<div class="mx-2 h-4 w-px bg-neutral-700"></div>

			<!-- Add entry -->
			<div class="flex items-center gap-2">
				<span class="text-xs text-neutral-500">Add entry:</span>
				<select
					bind:value={newEntrySection}
					class="w-36 rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs text-neutral-200 outline-none focus:border-blue-500"
				>
					<option value="">Section...</option>
					{#each sections as section}
						<option value={section}>{section}</option>
					{/each}
				</select>
				<input
					type="text"
					bind:value={newEntryName}
					placeholder="KeyName"
					class="w-32 rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs text-neutral-200 outline-none focus:border-blue-500"
				/>
				<input
					type="text"
					bind:value={newEntryValue}
					placeholder="Value"
					class="w-32 rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs text-neutral-200 outline-none focus:border-blue-500"
					onkeydown={(e) => {
						if (e.key === 'Enter') addEntry();
					}}
				/>
				<button
					onclick={addEntry}
					class="cursor-pointer rounded bg-neutral-700 px-2 py-1 text-xs text-neutral-300 transition-colors hover:bg-neutral-600"
				>
					+
				</button>
			</div>
		</div>

		<!-- Sections list -->
		<div class="flex-1 overflow-y-auto px-6 py-4">
			{#if activeTab === 'values'}
				{#if filteredSections.length === 0}
					<p class="text-center text-sm text-neutral-500">
						{searchQuery ? 'No matching sections found.' : 'No sections. Add one above.'}
					</p>
				{/if}
				{#each filteredSections as section (section)}
					{@const entries = Object.entries(data.Values[section]).sort(([a], [b]) =>
						a.localeCompare(b)
					)}
					{@const isCollapsed = collapsedSections.has(section)}
					<div class="mb-3 rounded-lg border border-neutral-800 bg-neutral-900">
						<!-- Section header -->
						<button
							onclick={() => toggleSection(section)}
							class="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left transition-colors hover:bg-neutral-800/50"
						>
							<svg
								class="h-3 w-3 text-neutral-500 transition-transform {isCollapsed
									? ''
									: 'rotate-90'}"
								fill="currentColor"
								viewBox="0 0 20 20"
							>
								<path d="M6 4l8 6-8 6V4z" />
							</svg>
							<span class="font-mono text-sm font-semibold text-blue-400">[{section}]</span>
							<span class="text-xs text-neutral-500">{entries.length} entries</span>
							<div class="flex-1"></div>
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<span
								onclick={(e: MouseEvent) => {
									e.stopPropagation();
									removeSection(section);
								}}
								class="rounded px-1.5 py-0.5 text-xs text-red-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-950 [div:hover>&]:opacity-100"
								role="button"
								tabindex="0"
							>
								Remove
							</span>
						</button>

						<!-- Entries -->
						{#if !isCollapsed}
							<div class="border-t border-neutral-800">
								{#each entries as [name, value] (name)}
									<div
										class="group flex items-center gap-2 border-b border-neutral-800/50 px-4 py-1.5 last:border-b-0 hover:bg-neutral-800/30"
									>
										<span
											class="w-60 shrink-0 truncate font-mono text-xs text-neutral-300"
											title={name}
										>
											{name}
										</span>
										<span class="text-neutral-600">=</span>
										<input
											type="text"
											value={formatDisplay(value)}
											onchange={(e) =>
												updateValue(section, name, (e.target as HTMLInputElement).value)}
											class="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1 py-0.5 font-mono text-xs text-emerald-400 outline-none hover:border-neutral-700 focus:border-blue-500 focus:bg-neutral-800"
										/>
										<button
											onclick={() => removeEntry(section, name)}
											class="cursor-pointer rounded px-1 py-0.5 text-xs text-red-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-950"
										>
											x
										</button>
									</div>
								{/each}
								{#if entries.length === 0}
									<p class="px-4 py-2 text-xs text-neutral-500 italic">Empty section</p>
								{/if}
							</div>
						{/if}
					</div>
				{/each}
			{:else}
				<!-- Unknown hashes tab -->
				{#if unknownKeys.length === 0}
					<p class="text-center text-sm text-neutral-500">No unknown hashes.</p>
				{:else}
					<div class="rounded-lg border border-neutral-800 bg-neutral-900">
						<div class="px-4 py-2 text-sm font-semibold text-orange-400">
							[UNKNOWN_HASHES]
							<span class="text-xs text-neutral-500">{unknownKeys.length} entries</span>
						</div>
						<div class="border-t border-neutral-800">
							{#each unknownKeys as hash (hash)}
								<div
									class="group flex items-center gap-2 border-b border-neutral-800/50 px-4 py-1.5 last:border-b-0 hover:bg-neutral-800/30"
								>
									<span class="w-60 shrink-0 font-mono text-xs text-orange-300">
										{formatHash(hash)}
									</span>
									<span class="text-neutral-600">=</span>
									<input
										type="text"
										value={formatDisplay(data.UNKNOWN_HASHES[hash])}
										onchange={(e) => updateUnknownValue(hash, (e.target as HTMLInputElement).value)}
										class="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1 py-0.5 font-mono text-xs text-emerald-400 outline-none hover:border-neutral-700 focus:border-blue-500 focus:bg-neutral-800"
									/>
									<button
										onclick={() => removeUnknownEntry(hash)}
										class="cursor-pointer rounded px-1 py-0.5 text-xs text-red-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-950"
									>
										x
									</button>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			{/if}
		</div>
	{/if}
</div>
