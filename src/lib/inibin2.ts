import type { InibinData, InibinValue } from './types';

export function ihash(section: string, name?: string): number;
export function ihash(value: string, initialHash?: number): number;
export function ihash(sectionOrValue: string, nameOrInitialHash?: string | number): number {
	let str: string;
	let ret: number;

	if (typeof nameOrInitialHash === 'string') {
		str = sectionOrValue + '*' + nameOrInitialHash;
		ret = 0;
	} else {
		str = sectionOrValue;
		ret = nameOrInitialHash ?? 0;
	}

	for (const c of str) {
		ret = (c.toLowerCase().charCodeAt(0) + Math.imul(65599, ret)) >>> 0;
	}
	return ret >>> 0;
}

const RE_TRUE = /^\s*true\s*$/i;
const RE_FALSE = /^\s*false\s*$/i;
const RE_NAN = /^\s*NaN\s*$/i;
const RE_INT = /^\s*[-+]?\d+\s*$/i;
const RE_DECIMAL = /^\s*[+-]?(?:\d+\.\d*|\d*\.\d+|\d+)(?:e[+-]?\d+)?\s*$/i;
const RE_INT_VEC = /^\s*(?:[-+]?\d+\s+)+(?:[-+]?\d+)\s*$/i;
const RE_DECIMAL_VEC =
	/^\s*(?:[+-]?(?:\d+\.\d*|\d*\.\d+|\d+)(?:e[+-]?\d+)?\s+)+([+-]?(?:\d+\.\d*|\d*\.\d+|\d+)(?:e[+-]?\d+)?)\s*$/i;

export function sanitizeStr(data: string): InibinValue {
	if (RE_TRUE.test(data)) {
		return 1;
	} else if (RE_FALSE.test(data)) {
		return 0;
	} else if (RE_NAN.test(data)) {
		return NaN;
	} else if (RE_INT_VEC.test(data)) {
		return data
			.replace(/\t/g, ' ')
			.split(' ')
			.filter((x) => x)
			.map((x) => parseInt(x, 10));
	} else if (RE_DECIMAL_VEC.test(data)) {
		return data
			.replace(/\t/g, ' ')
			.split(' ')
			.filter((x) => x)
			.map((x) => parseFloat(x));
	} else if (RE_INT.test(data)) {
		return parseInt(data, 10);
	} else if (RE_DECIMAL.test(data)) {
		return parseFloat(data);
	} else {
		return data;
	}
}

class BinaryReader {
	private view: DataView;
	private offset: number;
	readonly byteLength: number;

	constructor(buffer: ArrayBuffer) {
		this.view = new DataView(buffer);
		this.offset = 0;
		this.byteLength = buffer.byteLength;
	}

	get position(): number {
		return this.offset;
	}

	readUint8(): number {
		const value = this.view.getUint8(this.offset);
		this.offset += 1;
		return value;
	}

	readInt8(): number {
		const value = this.view.getInt8(this.offset);
		this.offset += 1;
		return value;
	}

	readUint16(): number {
		const value = this.view.getUint16(this.offset, true);
		this.offset += 2;
		return value;
	}

	readInt16(): number {
		const value = this.view.getInt16(this.offset, true);
		this.offset += 2;
		return value;
	}

	readUint32(): number {
		const value = this.view.getUint32(this.offset, true);
		this.offset += 4;
		return value;
	}

	readInt32(): number {
		const value = this.view.getInt32(this.offset, true);
		this.offset += 4;
		return value;
	}

	readFloat32(): number {
		const value = this.view.getFloat32(this.offset, true);
		this.offset += 4;
		return value;
	}

	readBigInt64(): bigint {
		const value = this.view.getBigInt64(this.offset, true);
		this.offset += 8;
		return value;
	}

	readBytes(count: number): Uint8Array {
		const bytes = new Uint8Array(this.view.buffer, this.offset, count);
		this.offset += count;
		return bytes;
	}

	skip(count: number): void {
		this.offset += count;
	}
}

type ReadNumberFmt = 'int32' | 'float32' | 'uint8' | 'int16' | 'uint16' | 'int64';

function readValue(reader: BinaryReader, fmt: ReadNumberFmt): number {
	switch (fmt) {
		case 'int32':
			return reader.readInt32();
		case 'float32':
			return reader.readFloat32();
		case 'uint8':
			return reader.readUint8();
		case 'int16':
			return reader.readInt16();
		case 'uint16':
			return reader.readUint16();
		case 'int64':
			return Number(reader.readBigInt64());
	}
}

function fmtSize(fmt: ReadNumberFmt): number {
	switch (fmt) {
		case 'int32':
			return 4;
		case 'float32':
			return 4;
		case 'uint8':
			return 1;
		case 'int16':
			return 2;
		case 'uint16':
			return 2;
		case 'int64':
			return 8;
	}
}

function readNumbers(
	reader: BinaryReader,
	fmt: ReadNumberFmt,
	count: number = 1,
	mul: number = 1
): Record<number, InibinValue> {
	const result: Record<number, InibinValue> = {};
	const num = reader.readUint16();
	const keys: number[] = [];

	for (let i = 0; i < num; i++) {
		keys.push(reader.readUint32());
	}

	for (let i = 0; i < num; i++) {
		const values: number[] = [];
		for (let j = 0; j < count; j++) {
			values.push(readValue(reader, fmt) * mul);
		}
		result[keys[i]] = count === 1 ? values[0] : values;
	}

	return result;
}

function readBools(reader: BinaryReader): Record<number, InibinValue> {
	const result: Record<number, InibinValue> = {};
	const num = reader.readUint16();
	const keys: number[] = [];

	for (let i = 0; i < num; i++) {
		keys.push(reader.readUint32());
	}

	const bytesCount = Math.floor(num / 8) + (num % 8 > 0 ? 1 : 0);
	const bools = reader.readBytes(bytesCount);

	for (let i = 0; i < num; i++) {
		result[keys[i]] = (bools[Math.floor(i / 8)] >> (i % 8)) & 1 ? 1 : 0;
	}

	return result;
}

function readStrings(reader: BinaryReader, stringsLength: number): Record<number, InibinValue> {
	const result: Record<number, InibinValue> = {};
	const offsets = readNumbers(reader, 'uint16');
	const data = reader.readBytes(stringsLength);

	for (const keyStr of Object.keys(offsets)) {
		const key = Number(keyStr);
		let o = offsets[key] as number;
		let t = '';
		while (data[o] !== 0) {
			t += String.fromCharCode(data[o]);
			o++;
		}
		result[key] = sanitizeStr(t);
	}

	return result;
}

function readV2(reader: BinaryReader, target: Record<number, InibinValue>): void {
	const stringsLength = reader.readUint16();
	let flags = reader.readUint16();

	if (flags === 0) {
		if (reader.position < reader.byteLength) {
			flags = reader.readUint16();
		}
	}

	type ReadConfig = {
		reader: (r: BinaryReader, ...args: never[]) => Record<number, InibinValue>;
		args: unknown[];
	};

	const readConf: ReadConfig[] = [
		{ reader: readNumbers, args: ['int32', 1] },
		{ reader: readNumbers, args: ['float32', 1] },
		{ reader: readNumbers, args: ['uint8', 1, 0.1] },
		{ reader: readNumbers, args: ['int16', 1] },
		{ reader: readNumbers, args: ['uint8', 1] },
		{ reader: readBools, args: [] },
		{ reader: readNumbers, args: ['uint8', 3, 0.1] },
		{ reader: readNumbers, args: ['float32', 3] },
		{ reader: readNumbers, args: ['uint8', 2, 0.1] },
		{ reader: readNumbers, args: ['float32', 2] },
		{ reader: readNumbers, args: ['uint8', 4, 0.1] },
		{ reader: readNumbers, args: ['float32', 4] },
		{ reader: readStrings, args: [stringsLength] },
		{ reader: readNumbers, args: ['int64', 1] }
	];

	if (flags & (1 << 13)) {
		console.warn('Found long long in inibin!');
	}

	if (flags & (1 << 14) || flags & (1 << 15)) {
		throw new Error('Unexpected flags set: bits 14 or 15');
	}

	for (let i = 0; i < 16; i++) {
		if (flags & (1 << i)) {
			if (i < readConf.length) {
				const conf = readConf[i];
				const entries = (conf.reader as any)(reader, ...conf.args);
				Object.assign(target, entries);
			} else {
				throw new Error(`Unknown inibin flag: ${i}`);
			}
		}
	}
}

function readV1(reader: BinaryReader, target: Record<number, InibinValue>): void {
	reader.skip(3);

	const entryCount = reader.readUint32();
	const dataCount = reader.readUint32();

	const offsets: Record<number, number> = {};
	for (let i = 0; i < entryCount; i++) {
		const h = reader.readUint32();
		const o = reader.readUint32();
		offsets[h] = o;
	}

	const data = reader.readBytes(dataCount);

	for (const keyStr of Object.keys(offsets)) {
		const key = Number(keyStr);
		let o = offsets[key];
		let t = '';
		while (data[o] !== 0) {
			t += String.fromCharCode(data[o]);
			o++;
		}
		target[key] = sanitizeStr(t);
	}
}

export function read(buffer: ArrayBuffer, result?: InibinData): InibinData {
	if (!result) {
		result = {
			Values: {},
			UNKNOWN_HASHES: {}
		};
	} else {
		if (!result.Values) result.Values = {};
		if (!result.UNKNOWN_HASHES) result.UNKNOWN_HASHES = {};
	}

	const reader = new BinaryReader(buffer);
	const target = result.UNKNOWN_HASHES;
	const version = reader.readUint8();

	if (version === 2) {
		readV2(reader, target);
	} else if (version === 1) {
		readV1(reader, target);
	} else {
		throw new Error(`Unknown inibin version (v${version}) or invalid file`);
	}

	if (reader.position !== reader.byteLength) {
		console.warn(
			`Warning: reader position (${reader.position}) does not match buffer length (${reader.byteLength})`
		);
	}

	return result;
}

export function get(
	target: InibinData,
	section: string,
	name: string,
	defaultValue?: InibinValue
): InibinValue | undefined {
	if (target.Values[section] && target.Values[section][name] !== undefined) {
		return target.Values[section][name];
	}

	const h = ihash(section, name);
	return h in target.UNKNOWN_HASHES ? target.UNKNOWN_HASHES[h] : defaultValue;
}
