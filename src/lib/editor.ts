import type { InibinData, InibinValue } from './types';
import { read } from './inibin2';
import { fix } from './inibin_fix';
import { troybinFix } from './troybin_fix';
import { readIni, writeIni, writeInibin } from './convert';

/**
 * Editing actions shared by the UI and the HTTP API, so both behave identically.
 */

export type FileType = 'inibin' | 'troybin';

export interface OpenedFile {
	data: InibinData;
	fileName: string;
	fileType: FileType;
}

export class EditorError extends Error {}

export const SUPPORTED_EXTENSIONS = ['.inibin', '.ini', '.troybin', '.troy'];

// --- Opening files ---

/** Parses file contents the same way the UI does when a file is opened */
export function openFile(fileName: string, buffer: ArrayBuffer): OpenedFile {
	const nameLower = fileName.toLowerCase();
	const isIni = nameLower.endsWith('.ini') || nameLower.endsWith('.troy');
	const isTroybin = nameLower.endsWith('.troybin') || nameLower.endsWith('.troy');
	let data: InibinData;

	if (isIni) {
		data = readIni(new TextDecoder().decode(buffer));
	} else {
		data = read(buffer);
		if (isTroybin) {
			troybinFix(data);
		} else {
			fix(data);
		}
	}

	return { data, fileName, fileType: isTroybin ? 'troybin' : 'inibin' };
}

// --- Values ---

/** Parses a value typed into an input field */
export function parseInputValue(raw: string): InibinValue {
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

export function formatDisplay(value: InibinValue): string {
	if (typeof value === 'string') return JSON.stringify(value);
	if (Array.isArray(value)) return value.join(' ');
	return String(value);
}

export function formatHash(hash: number): string {
	return `unk${hash.toString(16).toUpperCase().padStart(8, '0')}`;
}

/** Accepts a numeric hash, a decimal string, a 0x-prefixed hex string or an `unkXXXXXXXX` name */
export function parseHash(input: number | string): number {
	if (typeof input === 'number' && Number.isInteger(input) && input >= 0) return input >>> 0;
	if (typeof input === 'string') {
		const s = input.trim();
		const hex = s.match(/^(?:unk|0x)([0-9a-f]{1,8})$/i);
		if (hex) return parseInt(hex[1], 16);
		if (/^\d+$/.test(s)) return Number(s) >>> 0;
	}
	throw new EditorError(`Invalid hash: ${JSON.stringify(input)}`);
}

// --- Queries ---

export function getSections(data: InibinData): string[] {
	return Object.keys(data.Values).sort();
}

export function getUnknownKeys(data: InibinData): number[] {
	return Object.keys(data.UNKNOWN_HASHES)
		.map(Number)
		.sort((a, b) => a - b);
}

/** Sections whose name, or one of whose keys, contains the query (case-insensitive) */
export function filterSections(data: InibinData, query: string): string[] {
	const sections = getSections(data);
	if (!query) return sections;
	const q = query.toLowerCase();
	return sections.filter(
		(s) =>
			s.toLowerCase().includes(q) ||
			Object.keys(data.Values[s]).some((k) => k.toLowerCase().includes(q))
	);
}

export function countEntries(data: InibinData): number {
	let count = 0;
	for (const section of Object.values(data.Values)) {
		count += Object.keys(section).length;
	}
	count += Object.keys(data.UNKNOWN_HASHES).length;
	return count;
}

// --- Mutations (modify `data` in place) ---

export function addSection(data: InibinData, name: string): void {
	const section = name.trim();
	if (!section) throw new EditorError('Section name must not be empty');
	if (data.Values[section]) throw new EditorError(`Section "${section}" already exists`);
	data.Values[section] = {};
}

export function removeSection(data: InibinData, section: string): void {
	if (!data.Values[section]) throw new EditorError(`Section "${section}" does not exist`);
	delete data.Values[section];
}

/** Adds an entry or overwrites an existing one, creating the section if needed */
export function setEntry(
	data: InibinData,
	section: string,
	name: string,
	value: InibinValue
): void {
	const key = name.trim();
	if (!section) throw new EditorError('Section name must not be empty');
	if (!key) throw new EditorError('Key name must not be empty');
	if (!data.Values[section]) {
		data.Values[section] = {};
	}
	data.Values[section][key] = value;
}

export function removeEntry(data: InibinData, section: string, name: string): void {
	if (!data.Values[section] || !(name in data.Values[section])) {
		throw new EditorError(`Entry "${section}.${name}" does not exist`);
	}
	delete data.Values[section][name];
}

export function setUnknownValue(data: InibinData, hash: number, value: InibinValue): void {
	data.UNKNOWN_HASHES[hash] = value;
}

export function removeUnknownEntry(data: InibinData, hash: number): void {
	if (!(hash in data.UNKNOWN_HASHES)) {
		throw new EditorError(`Unknown hash ${formatHash(hash)} does not exist`);
	}
	delete data.UNKNOWN_HASHES[hash];
}

// --- Batch operations (used by the API) ---

/**
 * A value in an operation: strings are parsed like UI input (wrap in quotes to force a string),
 * numbers and number arrays are used as-is.
 */
export type OperationValue = string | number | number[];

export type Operation =
	| { op: 'addSection'; section: string }
	| { op: 'removeSection'; section: string }
	| { op: 'setEntry'; section: string; name: string; value: OperationValue }
	| { op: 'removeEntry'; section: string; name: string }
	| { op: 'setUnknown'; hash: number | string; value: OperationValue }
	| { op: 'removeUnknown'; hash: number | string };

function toValue(value: unknown): InibinValue {
	if (typeof value === 'string') return parseInputValue(value);
	if (typeof value === 'number') return value;
	if (Array.isArray(value) && value.every((n) => typeof n === 'number')) return value;
	throw new EditorError(`Invalid value: ${JSON.stringify(value)}`);
}

function requireString(op: Record<string, unknown>, field: string): string {
	const v = op[field];
	if (typeof v !== 'string') {
		throw new EditorError(`Operation "${op.op}" requires a string "${field}"`);
	}
	return v;
}

export function applyOperation(data: InibinData, op: Operation): void {
	const o = op as unknown as Record<string, unknown>;
	switch (op.op) {
		case 'addSection':
			return addSection(data, requireString(o, 'section'));
		case 'removeSection':
			return removeSection(data, requireString(o, 'section'));
		case 'setEntry':
			if (!('value' in o)) throw new EditorError('Operation "setEntry" requires a "value"');
			return setEntry(
				data,
				requireString(o, 'section'),
				requireString(o, 'name'),
				toValue(o.value)
			);
		case 'removeEntry':
			return removeEntry(data, requireString(o, 'section'), requireString(o, 'name'));
		case 'setUnknown':
			if (!('value' in o)) throw new EditorError('Operation "setUnknown" requires a "value"');
			return setUnknownValue(data, parseHash(op.hash), toValue(o.value));
		case 'removeUnknown':
			return removeUnknownEntry(data, parseHash(op.hash));
		default:
			throw new EditorError(`Unknown operation: ${JSON.stringify(o.op)}`);
	}
}

/** Applies operations in order; if one fails, the error says which */
export function applyOperations(data: InibinData, ops: Operation[]): void {
	ops.forEach((op, i) => {
		if (typeof op !== 'object' || op === null) {
			throw new EditorError(`Operation ${i} must be an object`);
		}
		try {
			applyOperation(data, op);
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			throw new EditorError(`Operation ${i} (${op.op}): ${msg}`);
		}
	});
}

// --- Export ---

export type ExportFormat = 'text' | 'binary';

function baseName(fileName: string): string {
	return fileName.replace(/\.(inibin|troybin|ini|troy)$/i, '');
}

/** The download name the UI uses for an export */
export function exportFileName(fileName: string, fileType: FileType, format: ExportFormat): string {
	if (format === 'text') {
		return baseName(fileName) + (fileType === 'troybin' ? '.troy' : '.ini');
	}
	const ext = fileType === 'troybin' ? '.troybin' : '.inibin';
	return fileName ? baseName(fileName) + ext : 'output' + ext;
}

export function exportText(data: InibinData): string {
	return writeIni(data);
}

export function exportBinary(data: InibinData): ArrayBuffer {
	return writeInibin(data);
}
