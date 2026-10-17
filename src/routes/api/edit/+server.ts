import type { RequestHandler } from './$types';
import { applyOperations } from '$lib/editor';
import {
	documentResponse,
	fileResponse,
	handle,
	readApiRequest,
	readFormat,
	readOperations
} from '$lib/server/api';

/** Applies `operations` in order, then returns the result as JSON or as a `text`/`binary` file */
export const POST: RequestHandler = ({ request, url }) =>
	handle(async () => {
		const req = await readApiRequest(request, url);
		const operations = readOperations(req);
		const format = readFormat(req, ['json', 'text', 'binary'], 'json');
		applyOperations(req.doc.data, operations);
		return format === 'json' ? documentResponse(req) : fileResponse(req.doc, format);
	});
