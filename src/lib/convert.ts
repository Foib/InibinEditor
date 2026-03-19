import type { InibinData, InibinValue } from './types';
import { ihash, read } from './inibin2';
import { fix } from './inibin_fix';
import { troybinFix } from './troybin_fix';

export function readIni(text: string): InibinData {
	const result: InibinData = {
		Values: {},
		UNKNOWN_HASHES: {}
	};

	let currentSection: string | null = null;

	const lines = text.split(/\r?\n/);
	for (const rawLine of lines) {
		const line = rawLine.trim();

		if (line === '' || line.startsWith(';') || line.startsWith('#')) {
			continue;
		}

		const sectionMatch = line.match(/^\[(.+)]$/);
		if (sectionMatch) {
			currentSection = sectionMatch[1];
			if (currentSection !== 'UNKNOWN_HASHES' && !result.Values[currentSection]) {
				result.Values[currentSection] = {};
			}
			continue;
		}

		const eqIndex = line.indexOf('=');
		if (eqIndex === -1 || currentSection === null) {
			continue;
		}

		const key = line.substring(0, eqIndex).trim();
		const rawValue = line.substring(eqIndex + 1).trim();
		const value = parseIniValue(rawValue);

		if (currentSection === 'UNKNOWN_HASHES') {
			const hashMatch = key.match(/^unk([0-9A-Fa-f]{1,8})$/);
			if (hashMatch) {
				const hash = parseInt(hashMatch[1], 16);
				result.UNKNOWN_HASHES[hash] = value;
			} else {
				if (!result.Values['UNKNOWN_HASHES']) {
					result.Values['UNKNOWN_HASHES'] = {};
				}
				result.Values['UNKNOWN_HASHES'][key] = value;
			}
		} else {
			result.Values[currentSection][key] = value;
		}
	}

	return result;
}

function parseIniValue(raw: string): InibinValue {
	if (raw.startsWith('"') && raw.endsWith('"')) {
		try {
			return JSON.parse(raw) as string;
		} catch {
			return raw.slice(1, -1);
		}
	}

	if (/^[-+]?(\d+\.?\d*|\d*\.?\d+)(e[-+]?\d+)?$/i.test(raw)) {
		const n = Number(raw);
		if (!isNaN(n)) return n;
	}

	if (/^[-+]?\d[\d.e+-]*(\s+[-+]?\d[\d.e+-]*)+$/i.test(raw)) {
		const parts = raw.split(/\s+/).map(Number);
		if (parts.every((n) => !isNaN(n))) return parts;
	}

	return raw;
}

function formatValue(name: string, value: InibinValue): string {
	if (typeof value === 'string') {
		return `${name}=${JSON.stringify(value)}\n`;
	} else if (Array.isArray(value)) {
		return `${name}=${value.join(' ')}\n`;
	} else if (typeof value === 'number') {
		return `${name}=${value}\n`;
	} else {
		throw new Error(`Unknown value type: ${typeof value}`);
	}
}

export function writeIni(ibin: InibinData): string {
	let output = '';

	const sortedSections = Object.keys(ibin.Values).sort();
	for (const section of sortedSections) {
		output += `[${section}]\n`;
		const names = ibin.Values[section];
		const sortedNames = Object.keys(names).sort();
		for (const name of sortedNames) {
			output += formatValue(name, names[name]);
		}
		output += '\n';
	}

	const unknownKeys = Object.keys(ibin.UNKNOWN_HASHES).map(Number);
	if (unknownKeys.length > 0) {
		output += '[UNKNOWN_HASHES]\n';
		const sortedKeys = unknownKeys.sort((a, b) => a - b);
		for (const key of sortedKeys) {
			const name = `unk${key.toString(16).toUpperCase().padStart(8, '0')}`;
			output += formatValue(name, ibin.UNKNOWN_HASHES[key]);
		}
	}

	return output;
}

export function inibin2ini(buffer: ArrayBuffer): string {
	const ibin = read(buffer);
	fix(ibin);
	return writeIni(ibin);
}

export function troybin2troy(buffer: ArrayBuffer): string {
	const tbin = read(buffer);
	troybinFix(tbin);
	return writeIni(tbin);
}

function classifyValue(value: InibinValue): { flag: number; count: number } | null {
	if (typeof value === 'string') {
		return { flag: 12, count: 1 };
	}

	if (Array.isArray(value)) {
		const len = value.length;
		if (len === 2) return { flag: 9, count: 2 };
		if (len === 3) return { flag: 7, count: 3 };
		if (len === 4) return { flag: 11, count: 4 };

		return { flag: 1, count: 1 };
	}

	if (typeof value === 'number') {
		if (Number.isInteger(value)) {
			return { flag: 0, count: 1 };
		}
		return { flag: 1, count: 1 };
	}
	return null;
}

class BinaryWriter {
	private chunks: ArrayBuffer[] = [];
	private current: DataView;
	private offset: number;
	private capacity: number;

	constructor(initialCapacity = 4096) {
		const buf = new ArrayBuffer(initialCapacity);
		this.current = new DataView(buf);
		this.offset = 0;
		this.capacity = initialCapacity;
	}

	private ensure(bytes: number): void {
		if (this.offset + bytes > this.capacity) {
			this.flush();
			const newCap = Math.max(this.capacity * 2, bytes);
			const buf = new ArrayBuffer(newCap);
			this.current = new DataView(buf);
			this.offset = 0;
			this.capacity = newCap;
		}
	}

	private flush(): void {
		if (this.offset > 0) {
			const copy = new ArrayBuffer(this.offset);
			new Uint8Array(copy).set(new Uint8Array(this.current.buffer as ArrayBuffer, 0, this.offset));
			this.chunks.push(copy);
			this.offset = 0;
		}
	}

	writeUint8(value: number): void {
		this.ensure(1);
		this.current.setUint8(this.offset, value);
		this.offset += 1;
	}

	writeUint16(value: number): void {
		this.ensure(2);
		this.current.setUint16(this.offset, value, true);
		this.offset += 2;
	}

	writeInt32(value: number): void {
		this.ensure(4);
		this.current.setInt32(this.offset, value, true);
		this.offset += 4;
	}

	writeUint32(value: number): void {
		this.ensure(4);
		this.current.setUint32(this.offset, value, true);
		this.offset += 4;
	}

	writeFloat32(value: number): void {
		this.ensure(4);
		this.current.setFloat32(this.offset, value, true);
		this.offset += 4;
	}

	writeBytes(data: Uint8Array): void {
		this.ensure(data.length);
		new Uint8Array(this.current.buffer, this.offset, data.length).set(data);
		this.offset += data.length;
	}

	toArrayBuffer(): ArrayBuffer {
		this.flush();
		const totalLength = this.chunks.reduce((sum, c) => sum + c.byteLength, 0);
		const result = new ArrayBuffer(totalLength);
		const view = new Uint8Array(result);
		let pos = 0;
		for (const chunk of this.chunks) {
			view.set(new Uint8Array(chunk), pos);
			pos += chunk.byteLength;
		}
		return result;
	}
}

export function writeInibin(ibin: InibinData): ArrayBuffer {
	const allEntries = new Map<number, InibinValue>();

	for (const [section, names] of Object.entries(ibin.Values)) {
		for (const [name, value] of Object.entries(names)) {
			const hash = ihash(section, name);
			allEntries.set(hash, value);
		}
	}

	for (const [hashStr, value] of Object.entries(ibin.UNKNOWN_HASHES)) {
		allEntries.set(Number(hashStr), value);
	}

	const buckets = new Map<number, { keys: number[]; values: InibinValue[] }>();
	for (let i = 0; i < 14; i++) {
		buckets.set(i, { keys: [], values: [] });
	}

	for (const [hash, value] of allEntries) {
		const cls = classifyValue(value);
		if (cls) {
			const bucket = buckets.get(cls.flag)!;
			bucket.keys.push(hash);
			bucket.values.push(value);
		}
	}

	const stringBucket = buckets.get(12)!;
	let stringTableBytes = new Uint8Array(0);
	const stringOffsets: number[] = [];
	if (stringBucket.keys.length > 0) {
		const encoder = new TextEncoder();
		const parts: Uint8Array[] = [];
		let offset = 0;
		for (const val of stringBucket.values) {
			const str = typeof val === 'string' ? val : String(val);
			stringOffsets.push(offset);
			const encoded = encoder.encode(str);
			parts.push(encoded);
			parts.push(new Uint8Array([0]));
			offset += encoded.length + 1;
		}
		stringTableBytes = new Uint8Array(offset);
		let pos = 0;
		for (const part of parts) {
			stringTableBytes.set(part, pos);
			pos += part.length;
		}
	}

	let flags = 0;
	for (let i = 0; i < 14; i++) {
		if (buckets.get(i)!.keys.length > 0) {
			flags |= 1 << i;
		}
	}

	const writer = new BinaryWriter();

	writer.writeUint8(2);
	writer.writeUint16(stringTableBytes.length);
	writer.writeUint16(flags);

	for (let i = 0; i < 14; i++) {
		if (!(flags & (1 << i))) continue;
		const bucket = buckets.get(i)!;

		if (i === 5) {
			writer.writeUint16(bucket.keys.length);
			for (const key of bucket.keys) writer.writeUint32(key);
			const bytesCount = Math.floor(bucket.keys.length / 8) + (bucket.keys.length % 8 > 0 ? 1 : 0);
			const boolBytes = new Uint8Array(bytesCount);
			for (let j = 0; j < bucket.values.length; j++) {
				if (bucket.values[j]) {
					boolBytes[Math.floor(j / 8)] |= 1 << (j % 8);
				}
			}
			writer.writeBytes(boolBytes);
		} else if (i === 12) {
			writer.writeUint16(bucket.keys.length);
			for (const key of bucket.keys) writer.writeUint32(key);
			for (const off of stringOffsets) writer.writeUint16(off);
			writer.writeBytes(stringTableBytes);
		} else {
			writer.writeUint16(bucket.keys.length);
			for (const key of bucket.keys) writer.writeUint32(key);
			for (const val of bucket.values) {
				const nums = Array.isArray(val) ? val : [val as number];
				for (const n of nums) {
					switch (i) {
						case 0:
							writer.writeInt32(Math.round(n));
							break;
						case 1:
							writer.writeFloat32(n);
							break;
						case 2:
							writer.writeUint8(Math.round(n / 0.1));
							break;
						case 3:
							writer.writeUint16(Math.round(n) & 0xffff);
							break;
						case 4:
							writer.writeUint8(Math.round(n) & 0xff);
							break;
						case 6:
							writer.writeUint8(Math.round(n / 0.1));
							break;
						case 7:
							writer.writeFloat32(n);
							break;
						case 8:
							writer.writeUint8(Math.round(n / 0.1));
							break;
						case 9:
							writer.writeFloat32(n);
							break;
						case 10:
							writer.writeUint8(Math.round(n / 0.1));
							break;
						case 11:
							writer.writeFloat32(n);
							break;
						case 13:
							writer.writeInt32(n & 0xffffffff);
							writer.writeInt32(Math.floor(n / 0x100000000));
							break;
					}
				}
			}
		}
	}

	return writer.toArrayBuffer();
}
