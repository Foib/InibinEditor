import { json } from '@sveltejs/kit';
import type { InibinData, InibinValue } from '$lib/types';
import {
	EditorError,
	openFile,
	parseHash,
	filterSections,
	countEntries,
	getUnknownKeys,
	exportText,
	exportBinary,
	exportFileName,
	type ExportFormat,
	type FileType,
	type OpenedFile,
	type Operation
} from '$lib/editor';

/** Thrown for malformed requests; turned into a 400 response */
export class ApiError extends Error {}

export interface ApiRequest {
	doc: OpenedFile;
	/** Reads an option from the JSON body / form fields, falling back to the query string */
	param(name: string): unknown;
}

/**
 * Reads the document to work on. Three request shapes are accepted:
 * - multipart/form-data with a `file` field (other fields are options)
 * - application/json with `{ fileName?, fileType?, data, ...options }`, as returned by /api/open
 * - any other body: the raw file bytes, with `?fileName=` in the query string
 */
export async function readApiRequest(request: Request, url: URL): Promise<ApiRequest> {
	const contentType = request.headers.get('content-type') ?? '';
	const query = (name: string) => url.searchParams.get(name) ?? undefined;

	if (contentType.startsWith('multipart/form-data')) {
		const form = await request.formData();
		const file = form.get('file');
		if (!(file instanceof File)) throw new ApiError('Missing "file" field in form data');
		const fileName = (form.get('fileName') as string | null) ?? file.name;
		return {
			doc: openOrFail(fileName, await file.arrayBuffer()),
			param: (name) => form.get(name) ?? query(name)
		};
	}

	if (contentType.startsWith('application/json')) {
		let body: unknown;
		try {
			body = await request.json();
		} catch {
			throw new ApiError('Request body is not valid JSON');
		}
		if (!isObject(body)) throw new ApiError('Request body must be a JSON object');
		return { doc: parseDocument(body), param: (name) => body[name] ?? query(name) };
	}

	const fileName = query('fileName');
	if (!fileName) {
		throw new ApiError(
			'Send the file as multipart/form-data, as a JSON document, or as a raw body with ?fileName='
		);
	}
	return { doc: openOrFail(fileName, await request.arrayBuffer()), param: query };
}

function openOrFail(fileName: string, buffer: ArrayBuffer): OpenedFile {
	try {
		return openFile(fileName, buffer);
	} catch (e) {
		throw new ApiError(`Could not read "${fileName}": ${e instanceof Error ? e.message : e}`);
	}
}

function isObject(v: unknown): v is Record<string, unknown> {
	return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** JSON has no NaN, so NaN values are serialized as null and read back as NaN */
function parseValue(v: unknown, where: string): InibinValue {
	if (v === null) return NaN;
	if (typeof v === 'number' || typeof v === 'string') return v;
	if (Array.isArray(v) && v.every((n) => typeof n === 'number' || n === null)) {
		return v.map((n) => (n === null ? NaN : n));
	}
	throw new ApiError(`Invalid value at ${where}: ${JSON.stringify(v)}`);
}

function parseDocument(body: Record<string, unknown>): OpenedFile {
	const raw = body.data;
	if (!isObject(raw) || !isObject(raw.Values)) {
		throw new ApiError(
			'JSON body must contain "data": { "Values": {...}, "UNKNOWN_HASHES": {...} }'
		);
	}

	const data: InibinData = { Values: {}, UNKNOWN_HASHES: {} };
	for (const [section, entries] of Object.entries(raw.Values)) {
		if (!isObject(entries)) throw new ApiError(`Section "${section}" must be an object`);
		data.Values[section] = {};
		for (const [name, value] of Object.entries(entries)) {
			data.Values[section][name] = parseValue(value, `Values.${section}.${name}`);
		}
	}

	const unknown = raw.UNKNOWN_HASHES ?? {};
	if (!isObject(unknown)) throw new ApiError('"UNKNOWN_HASHES" must be an object');
	for (const [key, value] of Object.entries(unknown)) {
		let hash: number;
		try {
			hash = parseHash(key);
		} catch (e) {
			throw new ApiError(`UNKNOWN_HASHES: ${(e as Error).message}`);
		}
		data.UNKNOWN_HASHES[hash] = parseValue(value, `UNKNOWN_HASHES.${key}`);
	}

	const fileName = typeof body.fileName === 'string' ? body.fileName : '';
	let fileType: FileType;
	if (body.fileType === 'inibin' || body.fileType === 'troybin') {
		fileType = body.fileType;
	} else if (body.fileType === undefined) {
		fileType = /\.troy(bin)?$/i.test(fileName) ? 'troybin' : 'inibin';
	} else {
		throw new ApiError('"fileType" must be "inibin" or "troybin"');
	}

	return { data, fileName, fileType };
}

/** Reads the `operations` option, which may be an array or a JSON string of one */
export function readOperations(req: ApiRequest): Operation[] {
	let ops = req.param('operations');
	if (ops === undefined) return [];
	if (typeof ops === 'string') {
		try {
			ops = JSON.parse(ops);
		} catch {
			throw new ApiError('"operations" is not valid JSON');
		}
	}
	if (!Array.isArray(ops)) throw new ApiError('"operations" must be an array');
	return ops as Operation[];
}

export function readFormat<T extends string>(req: ApiRequest, allowed: T[], fallback?: T): T {
	const format = req.param('format') ?? fallback;
	if (!allowed.includes(format as T)) {
		throw new ApiError(`"format" must be one of: ${allowed.map((f) => `"${f}"`).join(', ')}`);
	}
	return format as T;
}

/** The JSON representation of a document, accepted back as input by every endpoint */
export function documentResponse(req: ApiRequest): Response {
	const { data, fileName, fileType } = req.doc;
	const search = req.param('search');
	return json({
		fileName,
		fileType,
		stats: {
			sections: Object.keys(data.Values).length,
			entries: countEntries(data),
			unknown: getUnknownKeys(data).length
		},
		sections: filterSections(data, typeof search === 'string' ? search : ''),
		data
	});
}

export function fileResponse(doc: OpenedFile, format: ExportFormat): Response {
	const name = exportFileName(doc.fileName, doc.fileType, format);
	const body = format === 'text' ? exportText(doc.data) : exportBinary(doc.data);
	const asciiName = name.replace(/[^\x20-\x7e]|["\\]/g, '_');
	return new Response(body, {
		headers: {
			'content-type': format === 'text' ? 'text/plain; charset=utf-8' : 'application/octet-stream',
			'content-disposition': `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(name)}`
		}
	});
}

/** Wraps a handler so input and editing errors become `400 { error }` responses */
export async function handle(fn: () => Promise<Response>): Promise<Response> {
	try {
		return await fn();
	} catch (e) {
		if (e instanceof ApiError || e instanceof EditorError) {
			return json({ error: e.message }, { status: 400 });
		}
		throw e;
	}
}
